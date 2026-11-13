import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;
  const header = req.headers.authorization;
  if (!token && header?.startsWith('Bearer ')) token = header.slice(7);
  if (!token) throw new ApiError(401, 'Please sign in to continue', { code: 'AUTH_REQUIRED' });

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again.', { code: 'INVALID_TOKEN' });
  }
  // Always load the user fresh so role/approval changes and deletions apply immediately.
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'Account no longer exists', { code: 'INVALID_TOKEN' });
  if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw new ApiError(401, 'Your password was changed. Please sign in again.', { code: 'INVALID_TOKEN' });
  }
  req.user = user;
  next();
});

export const requireApproved = (req, res, next) => {
  const u = req.user;
  if (u.role === 'student' && u.registrationStatus !== 'approved') {
    const msg = u.registrationStatus === 'rejected' ? 'Your registration was rejected by an administrator.' : 'Your account is awaiting administrator approval.';
    return next(new ApiError(403, msg, { code: 'ACCOUNT_NOT_APPROVED' }));
  }
  next();
};

export const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : next(new ApiError(403, 'You do not have permission to perform this action', { code: 'FORBIDDEN' }));

// authenticate + approved-student check
export const protect = [authenticate, requireApproved];
