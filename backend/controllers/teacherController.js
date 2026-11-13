import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, buildPagination } from '../utils/pagination.js';
import { queryString, searchRegex } from '../utils/helpers.js';

// Public fields only (no email, no hashes).
export const PUBLIC_TEACHER_FIELDS = 'name department subject qualification bio profileImage officeLocation experienceYears';

export const listTeachers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 9 });
  const filter = { role: 'teacher' };
  const department = queryString(req.query.department);
  if (department) filter.department = department;
  const q = queryString(req.query.q);
  if (q) {
    const rx = searchRegex(q);
    filter.$or = [{ name: rx }, { department: rx }, { subject: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).select(PUBLIC_TEACHER_FIELDS).sort({ name: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, pagination: buildPagination(page, limit, total) });
});

export const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' }).select(PUBLIC_TEACHER_FIELDS);
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  res.json({ success: true, data: { teacher } });
});

export const listDepartments = asyncHandler(async (req, res) => {
  const departments = (await User.distinct('department', { role: 'teacher' })).filter(Boolean).sort();
  res.json({ success: true, data: departments });
});
