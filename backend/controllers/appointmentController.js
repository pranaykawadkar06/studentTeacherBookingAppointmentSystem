import Appointment from '../models/Appointment.js';
import Availability from '../models/Availability.js';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, buildPagination } from '../utils/pagination.js';
import { queryString, searchRegex, idEquals } from '../utils/helpers.js';
import { isValidDateStr } from '../utils/time.js';
import { emails } from '../services/emailService.js';
import { completePastAppointments } from '../services/appointmentLifecycle.js';

const POPULATE = [
  { path: 'student', select: 'name email course rollNumber' },
  { path: 'teacher', select: 'name email department subject' },
];

const releaseSlot = (appt, status = 'available') =>
  Availability.updateOne({ _id: appt.availability, status: 'booked' }, { status });

// Explains why an atomic status transition matched nothing.
const explainFailure = async (id, user, expectedStatus) => {
  const appt = await Appointment.findById(id);
  if (!appt || !idEquals(appt.teacher, user._id)) throw new ApiError(404, 'Appointment not found');
  if (appt.status !== expectedStatus) throw new ApiError(409, `This appointment is already ${appt.status}`);
  throw new ApiError(400, 'This appointment time has already passed');
};

/**
 * Concurrency strategy (works on standalone MongoDB, no transactions required):
 *  1. Atomically claim the slot: findOneAndUpdate({status:'available'} -> 'booked'). Only one request can win.
 *  2. Create the appointment. Unique partial indexes (teacher+startAt, availability) make a second active
 *     appointment for the same slot impossible even if application logic is bypassed.
 *  3. If step 2 fails for any other reason, the slot is released again.
 */
export const createAppointment = asyncHandler(async (req, res) => {
  const { availabilityId, purpose, notifyTeacher } = req.body;
  const slot = await Availability.findById(availabilityId);
  if (!slot) throw new ApiError(404, 'Slot not found');
  if (slot.startAt <= new Date()) throw new ApiError(400, 'This slot is in the past');

  const clash = await Appointment.exists({ student: req.user._id, isActive: true, startAt: { $lt: slot.endAt }, endAt: { $gt: slot.startAt } });
  if (clash) throw new ApiError(409, 'You already have an appointment at this time');

  const claimed = await Availability.findOneAndUpdate({ _id: slot._id, status: 'available' }, { status: 'booked' }, { new: true });
  if (!claimed) throw new ApiError(409, 'This slot is no longer available');

  let appt;
  try {
    appt = await Appointment.create({
      student: req.user._id,
      teacher: claimed.teacher,
      availability: claimed._id,
      date: claimed.date,
      startTime: claimed.startTime,
      endTime: claimed.endTime,
      startAt: claimed.startAt,
      endAt: claimed.endAt,
      purpose,
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'This slot was just booked by someone else');
    await Availability.updateOne({ _id: claimed._id, status: 'booked' }, { status: 'available' });
    throw err;
  }

  await appt.populate(POPULATE);
  const emailStatus = notifyTeacher ? await emails.bookingRequested(appt) : 'skipped';
  res.status(201).json({ success: true, message: 'Appointment request sent', data: { appointment: appt, emailStatus } });
});

export const listAppointments = asyncHandler(async (req, res) => {
  await completePastAppointments();
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.user.role === 'student') filter.student = req.user._id;
  if (req.user.role === 'teacher') filter.teacher = req.user._id;

  const status = queryString(req.query.status);
  if (['pending', 'approved', 'rejected', 'cancelled', 'completed'].includes(status)) filter.status = status;
  const from = queryString(req.query.from);
  const to = queryString(req.query.to);
  if (isValidDateStr(from)) filter.date = { ...filter.date, $gte: from };
  if (isValidDateStr(to)) filter.date = { ...filter.date, $lte: to };
  if (req.query.upcoming === 'true') filter.startAt = { $gte: new Date() };

  const q = queryString(req.query.q);
  if (q) {
    const rx = searchRegex(q);
    const ids = await User.distinct('_id', { name: rx });
    filter.$or = [{ student: { $in: ids } }, { teacher: { $in: ids } }, { purpose: rx }];
  }

  const sort = req.query.sort === 'asc' ? { startAt: 1 } : { startAt: -1 };
  const [items, total] = await Promise.all([
    Appointment.find(filter).sort(sort).skip(skip).limit(limit).populate(POPULATE),
    Appointment.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, pagination: buildPagination(page, limit, total) });
});

export const getAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(req.params.id).populate(POPULATE);
  const u = req.user;
  const allowed = appt && (u.role === 'admin' || idEquals(appt.student, u._id) || idEquals(appt.teacher, u._id));
  if (!allowed) throw new ApiError(404, 'Appointment not found'); // 404 avoids leaking existence
  res.json({ success: true, data: { appointment: appt } });
});

export const approveAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findOneAndUpdate(
    { _id: req.params.id, teacher: req.user._id, status: 'pending', startAt: { $gt: new Date() } },
    { status: 'approved', isActive: true, decisionNote: req.body.note || undefined },
    { new: true }
  ).populate(POPULATE);
  if (!appt) await explainFailure(req.params.id, req.user, 'pending');
  const emailStatus = await emails.approved(appt);
  res.json({ success: true, message: 'Appointment approved', data: { appointment: appt, emailStatus } });
});

export const rejectAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findOneAndUpdate(
    { _id: req.params.id, teacher: req.user._id, status: 'pending' },
    { status: 'rejected', isActive: false, decisionNote: req.body.reason || undefined },
    { new: true }
  ).populate(POPULATE);
  if (!appt) await explainFailure(req.params.id, req.user, 'pending');
  await releaseSlot(appt, 'available');
  const emailStatus = await emails.rejected(appt);
  res.json({ success: true, message: 'Appointment rejected', data: { appointment: appt, emailStatus } });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const role = req.user.role; // route allows student | teacher only
  const appt = await Appointment.findById(req.params.id);
  const owns = appt && idEquals(role === 'student' ? appt.student : appt.teacher, req.user._id);
  if (!owns) throw new ApiError(404, 'Appointment not found');
  if (!['pending', 'approved'].includes(appt.status)) throw new ApiError(409, `This appointment is already ${appt.status}`);
  if (appt.startAt <= new Date()) throw new ApiError(400, 'Past appointments cannot be cancelled');

  const reason = req.body.reason;
  if (role === 'student' && appt.status === 'approved') {
    const hoursLeft = (appt.startAt.getTime() - Date.now()) / 36e5;
    if (hoursLeft < config.cancellationMinHours) {
      throw new ApiError(400, `Approved appointments can only be cancelled at least ${config.cancellationMinHours} hour(s) before they start. Please message your teacher instead.`);
    }
  }
  if (role === 'teacher' && (!reason || reason.length < 3)) throw new ApiError(400, 'Please provide a reason for cancelling');

  const updated = await Appointment.findOneAndUpdate(
    { _id: appt._id, status: appt.status },
    { status: 'cancelled', isActive: false, cancelledBy: role, cancellationReason: reason || undefined },
    { new: true }
  ).populate(POPULATE);
  if (!updated) throw new ApiError(409, 'This appointment was just updated. Refresh and try again.');

  // Student cancellations reopen the slot; a teacher cancelling blocks it so it isn't rebooked unintentionally.
  await releaseSlot(updated, role === 'teacher' ? 'blocked' : 'available');
  const emailStatus = await emails.cancelled(updated, role);
  res.json({ success: true, message: 'Appointment cancelled', data: { appointment: updated, emailStatus } });
});
