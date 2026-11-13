import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Availability from '../models/Availability.js';
import Message from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PUBLIC_TEACHER_FIELDS } from './teacherController.js';
import { completePastAppointments } from '../services/appointmentLifecycle.js';

const POPULATE = [
  { path: 'student', select: 'name email' },
  { path: 'teacher', select: 'name department subject' },
];

const adminStats = async () => {
  const [totalTeachers, totalStudents, pendingStudents, totalAppointments, statusAgg, recent] = await Promise.all([
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', registrationStatus: 'pending' }),
    Appointment.countDocuments(),
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.find().sort({ createdAt: -1 }).limit(6).populate(POPULATE),
  ]);
  const byStatus = { pending: 0, approved: 0, completed: 0, rejected: 0, cancelled: 0 };
  statusAgg.forEach((s) => (byStatus[s._id] = s.count));
  return { totalTeachers, totalStudents, pendingStudents, totalAppointments, byStatus, recentAppointments: recent };
};

const teacherStats = async (user) => {
  const now = new Date();
  const mine = { teacher: user._id };
  const [pendingRequests, upcomingCount, upcoming, totalAppointments, availableSlots, unreadMessages, recentMessages] = await Promise.all([
    Appointment.countDocuments({ ...mine, status: 'pending', startAt: { $gt: now } }),
    Appointment.countDocuments({ ...mine, status: 'approved', startAt: { $gt: now } }),
    Appointment.find({ ...mine, status: 'approved', startAt: { $gt: now } }).sort({ startAt: 1 }).limit(5).populate(POPULATE),
    Appointment.countDocuments(mine),
    Availability.countDocuments({ ...mine, status: 'available', startAt: { $gt: now } }),
    Message.countDocuments({ recipient: user._id, read: false }),
    Message.find({ recipient: user._id }).sort({ createdAt: -1 }).limit(5).populate('sender', 'name'),
  ]);
  return { pendingRequests, upcomingCount, upcomingAppointments: upcoming, totalAppointments, availableSlots, unreadMessages, recentMessages };
};

const studentStats = async (user) => {
  const now = new Date();
  const mine = { student: user._id };
  const [upcomingCount, upcoming, pendingRequests, approvedCount, totalAppointments, unreadMessages, teachers] = await Promise.all([
    Appointment.countDocuments({ ...mine, isActive: true, startAt: { $gt: now } }),
    Appointment.find({ ...mine, isActive: true, startAt: { $gt: now } }).sort({ startAt: 1 }).limit(5).populate(POPULATE),
    Appointment.countDocuments({ ...mine, status: 'pending', startAt: { $gt: now } }),
    Appointment.countDocuments({ ...mine, status: { $in: ['approved', 'completed'] } }),
    Appointment.countDocuments(mine),
    Message.countDocuments({ recipient: user._id, read: false }),
    User.find({ role: 'teacher' }).select(PUBLIC_TEACHER_FIELDS).sort({ createdAt: -1 }).limit(4),
  ]);
  return { upcomingCount, upcomingAppointments: upcoming, pendingRequests, approvedCount, totalAppointments, unreadMessages, featuredTeachers: teachers };
};

export const getDashboard = asyncHandler(async (req, res) => {
  await completePastAppointments();
  const role = req.user.role;
  const data = role === 'admin' ? await adminStats() : role === 'teacher' ? await teacherStats(req.user) : await studentStats(req.user);
  res.json({ success: true, data: { role, ...data } });
});
