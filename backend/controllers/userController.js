import User from '../models/User.js';
import { signToken, setAuthCookie } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, buildPagination } from '../utils/pagination.js';
import { queryString, searchRegex } from '../utils/helpers.js';

const COMMON = ['name', 'phone', 'bio', 'profileImage'];
const BY_ROLE = {
  teacher: ['department', 'subject', 'qualification', 'officeLocation', 'experienceYears'],
  student: ['course', 'rollNumber'],
  admin: [],
};

export const updateMe = asyncHandler(async (req, res) => {
  const allowed = [...COMMON, ...BY_ROLE[req.user.role]];
  for (const key of allowed) if (req.body[key] !== undefined) req.user[key] = req.body[key];
  await req.user.save();
  res.json({ success: true, message: 'Profile updated', data: { user: req.user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.password = req.body.newPassword;
  await user.save();
  // Other sessions are now invalid; keep this one signed in with a fresh token.
  setAuthCookie(res, signToken(user));
  res.json({ success: true, message: 'Password changed' });
});

// Admin: list users with filters
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  const role = queryString(req.query.role);
  if (['student', 'teacher'].includes(role)) filter.role = role;
  else filter.role = { $in: ['student', 'teacher'] };
  const status = queryString(req.query.registrationStatus);
  if (['pending', 'approved', 'rejected'].includes(status)) filter.registrationStatus = status;
  const q = queryString(req.query.q);
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ name: rx }, { email: rx }, { department: rx }, { subject: rx }, { rollNumber: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, pagination: buildPagination(page, limit, total) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: { $in: ['student', 'teacher'] } });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: { user } });
});

// Teacher: approved students (used to pick message recipients)
export const listStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 50 });
  const filter = { role: 'student', registrationStatus: 'approved' };
  const q = queryString(req.query.q);
  if (q) filter.name = searchRegex(q);
  const [items, total] = await Promise.all([
    User.find(filter).select('name email course rollNumber').sort({ name: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, pagination: buildPagination(page, limit, total) });
});
