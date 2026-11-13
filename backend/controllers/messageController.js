import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, buildPagination } from '../utils/pagination.js';
import { queryString, idEquals } from '../utils/helpers.js';
import { emails } from '../services/emailService.js';

const POPULATE = [
  { path: 'sender', select: 'name role' },
  { path: 'recipient', select: 'name role' },
  { path: 'appointment', select: 'date startTime endTime status' },
];

// Students message teachers; teachers message approved students.
export const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, appointmentId, subject, content, notifyByEmail } = req.body;
  const wantedRole = req.user.role === 'student' ? 'teacher' : 'student';
  const recipient = await User.findOne({ _id: recipientId, role: wantedRole });
  if (!recipient || (wantedRole === 'student' && recipient.registrationStatus !== 'approved')) {
    throw new ApiError(404, 'Recipient not found');
  }
  if (appointmentId) {
    const appt = await Appointment.findOne({ _id: appointmentId, $or: [{ student: req.user._id }, { teacher: req.user._id }] });
    if (!appt || !(idEquals(appt.student, recipient._id) || idEquals(appt.teacher, recipient._id))) {
      throw new ApiError(404, 'Appointment not found');
    }
  }
  const message = await Message.create({ sender: req.user._id, recipient: recipient._id, appointment: appointmentId, subject, content });
  await message.populate(POPULATE);
  const emailStatus = notifyByEmail ? await emails.newMessage(req.user, recipient, message) : 'skipped';
  res.status(201).json({ success: true, message: 'Message sent', data: { message, emailStatus } });
});

export const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 15 });
  const box = queryString(req.query.box) === 'sent' ? 'sent' : 'inbox';
  const filter = box === 'sent' ? { sender: req.user._id } : { recipient: req.user._id };
  if (box === 'inbox' && req.query.unread === 'true') filter.read = false;
  const [items, total, unread] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(POPULATE),
    Message.countDocuments(filter),
    Message.countDocuments({ recipient: req.user._id, read: false }),
  ]);
  res.json({ success: true, data: items, pagination: { ...buildPagination(page, limit, total), unread } });
});

export const markRead = asyncHandler(async (req, res) => {
  const message = await Message.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true }, { new: true });
  if (!message) throw new ApiError(404, 'Message not found');
  res.json({ success: true, data: { message } });
});
