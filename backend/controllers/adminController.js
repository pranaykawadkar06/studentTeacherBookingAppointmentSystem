import User from '../models/User.js';
import Availability from '../models/Availability.js';
import Appointment from '../models/Appointment.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { emails } from '../services/emailService.js';

export const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await User.create({ ...req.body, role: 'teacher', registrationStatus: 'approved' });
  res.status(201).json({ success: true, message: 'Teacher created', data: { user: teacher } });
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  const { password, ...fields } = req.body;
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) teacher[key] = value;
  if (password) teacher.password = password;
  await teacher.save();
  res.json({ success: true, message: 'Teacher updated', data: { user: teacher } });
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  const hasActive = await Appointment.exists({ teacher: teacher._id, isActive: true, startAt: { $gt: new Date() } });
  if (hasActive) {
    throw new ApiError(409, 'This teacher has pending or approved upcoming appointments. Ask them to cancel or complete these first.');
  }
  await Availability.deleteMany({ teacher: teacher._id });
  await teacher.deleteOne();
  res.json({ success: true, message: 'Teacher deleted' });
});

export const setStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'student' },
    { registrationStatus: status, reviewedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!student) throw new ApiError(404, 'Student not found');
  const emailStatus = status === 'pending' ? 'skipped' : await emails.registrationDecision(student, status);
  res.json({ success: true, message: `Student ${status}`, data: { user: student, emailStatus } });
});
