import Availability from '../models/Availability.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, buildPagination } from '../utils/pagination.js';
import { queryString } from '../utils/helpers.js';
import { isValidDateStr, isValidTimeStr, toMinutes, fromMinutes, toDateTime, addDays } from '../utils/time.js';

const assertDateTime = (date, ...times) => {
  if (!isValidDateStr(date)) throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
  for (const t of times) if (!isValidTimeStr(t)) throw new ApiError(400, 'Times must be in HH:mm (24-hour) format');
};

export const createSlots = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, slotDuration, repeatWeeks } = req.body;
  assertDateTime(date, startTime, endTime);
  const startMin = toMinutes(startTime);
  const endMin = toMinutes(endTime);
  if (endMin <= startMin) throw new ApiError(400, 'End time must be after start time');
  if (endMin - startMin < slotDuration) throw new ApiError(400, 'The time window is shorter than one slot');
  if (toDateTime(date, startTime) <= new Date()) throw new ApiError(400, 'Availability must start in the future');

  const docs = [];
  for (let w = 0; w <= repeatWeeks; w++) {
    const d = addDays(date, w * 7);
    for (let m = startMin; m + slotDuration <= endMin; m += slotDuration) {
      const st = fromMinutes(m);
      const et = fromMinutes(m + slotDuration);
      docs.push({ teacher: req.user._id, date: d, startTime: st, endTime: et, startAt: toDateTime(d, st), endAt: toDateTime(d, et), slotDuration });
    }
  }

  const minStart = docs[0].startAt;
  const maxEnd = docs[docs.length - 1].endAt;
  const existing = await Availability.find({ teacher: req.user._id, startAt: { $lt: maxEnd }, endAt: { $gt: minStart } }).select('startAt endAt date startTime');
  const clash = existing.find((e) => docs.some((d) => d.startAt < e.endAt && d.endAt > e.startAt));
  if (clash) throw new ApiError(409, `This overlaps an existing slot on ${clash.date} at ${clash.startTime}`);

  await Availability.insertMany(docs);
  res.status(201).json({ success: true, message: `${docs.length} slot${docs.length === 1 ? '' : 's'} created`, data: { created: docs.length } });
});

export const mySlots = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20 });
  const filter = { teacher: req.user._id };
  const status = queryString(req.query.status);
  if (['available', 'booked', 'blocked'].includes(status)) filter.status = status;
  const from = queryString(req.query.from);
  if (isValidDateStr(from)) filter.date = { ...(filter.date || {}), $gte: from };
  const to = queryString(req.query.to);
  if (isValidDateStr(to)) filter.date = { ...(filter.date || {}), $lte: to };

  const [slots, total] = await Promise.all([
    Availability.find(filter).sort({ startAt: 1 }).skip(skip).limit(limit).lean(),
    Availability.countDocuments(filter),
  ]);
  const bookings = await Appointment.find({ availability: { $in: slots.map((s) => s._id) }, status: { $in: ['pending', 'approved', 'completed'] } }).populate('student', 'name').lean();
  const byslot = new Map(bookings.map((b) => [String(b.availability), b]));
  const data = slots.map((s) => {
    const b = byslot.get(String(s._id));
    return { ...s, booking: b ? { appointmentId: b._id, studentName: b.student?.name, status: b.status } : null };
  });
  res.json({ success: true, data, pagination: buildPagination(page, limit, total) });
});

// Any signed-in, approved user can see a teacher's open future slots.
export const teacherSlots = asyncHandler(async (req, res) => {
  const teacher = await User.exists({ _id: req.params.teacherId, role: 'teacher' });
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  const slots = await Availability.find({ teacher: req.params.teacherId, status: 'available', startAt: { $gt: new Date() } })
    .sort({ startAt: 1 })
    .limit(200)
    .select('date startTime endTime slotDuration status');
  res.json({ success: true, data: slots });
});

export const getSlot = asyncHandler(async (req, res) => {
  const slot = await Availability.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!slot) throw new ApiError(404, 'Slot not found');
  res.json({ success: true, data: { slot } });
});

export const updateSlot = asyncHandler(async (req, res) => {
  const slot = await Availability.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!slot) throw new ApiError(404, 'Slot not found');
  if (slot.status === 'booked') throw new ApiError(409, 'This slot is booked. Cancel the appointment before changing it.');

  const { status } = req.body;
  const date = req.body.date ?? slot.date;
  const startTime = req.body.startTime ?? slot.startTime;
  const endTime = req.body.endTime ?? slot.endTime;
  const timeChanged = date !== slot.date || startTime !== slot.startTime || endTime !== slot.endTime;

  if (timeChanged) {
    assertDateTime(date, startTime, endTime);
    if (toMinutes(endTime) <= toMinutes(startTime)) throw new ApiError(400, 'End time must be after start time');
    const startAt = toDateTime(date, startTime);
    const endAt = toDateTime(date, endTime);
    if (startAt <= new Date()) throw new ApiError(400, 'Slot must start in the future');
    const clash = await Availability.exists({ _id: { $ne: slot._id }, teacher: req.user._id, startAt: { $lt: endAt }, endAt: { $gt: startAt } });
    if (clash) throw new ApiError(409, 'This overlaps another slot of yours');
    Object.assign(slot, { date, startTime, endTime, startAt, endAt, slotDuration: toMinutes(endTime) - toMinutes(startTime) });
  }
  if (status) slot.status = status;
  await slot.save();
  res.json({ success: true, message: 'Slot updated', data: { slot } });
});

export const deleteSlot = asyncHandler(async (req, res) => {
  const slot = await Availability.findOneAndDelete({ _id: req.params.id, teacher: req.user._id, status: { $ne: 'booked' } });
  if (!slot) {
    const exists = await Availability.exists({ _id: req.params.id, teacher: req.user._id });
    throw exists ? new ApiError(409, 'This slot is booked. Cancel the appointment first.') : new ApiError(404, 'Slot not found');
  }
  res.json({ success: true, message: 'Slot deleted' });
});
