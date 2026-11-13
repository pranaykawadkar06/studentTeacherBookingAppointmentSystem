import User, { DUMMY_HASH } from '../models/User.js';
import bcrypt from 'bcrypt';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken, setAuthCookie, clearAuthCookie, generateResetToken, hashToken } from '../utils/token.js';
import { emails } from '../services/emailService.js';

export const RESET_TOKEN_MINUTES = 30;

// Public registration always creates a *student* in "pending" state. The role field is not accepted.
export const register = asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create({ ...req.body, role: 'student' });
  res.status(201).json({
    success: true,
    message: 'Registration submitted. You can use the app once an administrator approves your account.',
    data: { user },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  // Compare against a dummy hash when the user doesn't exist to keep response time similar.
  const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !valid) throw new ApiError(401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });

  setAuthCookie(res, signToken(user));
  res.json({ success: true, message: 'Signed in', data: { user } });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Signed out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

/**
 * Always answers the same way, whether or not the email belongs to an account, so the endpoint
 * can't be used to discover who is registered. The email is sent without being awaited so
 * response time doesn't reveal it either.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const { token, hash } = generateResetToken();
    await User.updateOne(
      { _id: user._id },
      { passwordResetToken: hash, passwordResetExpires: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000) }
    );
    const url = `${config.clientUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
    emails.passwordReset(user, url, RESET_TOKEN_MINUTES).then((status) => {
      // Never log the link or token.
      if (status !== 'sent') console.warn(`[mail] Password reset email was not sent (${status}).`);
    });
  }
  res.json({ success: true, message: 'If an account exists for that email, a password reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    passwordResetToken: hashToken(req.body.token.toLowerCase()),
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetToken +passwordResetExpires');
  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired. Request a new one.', { code: 'INVALID_RESET_TOKEN' });

  user.password = req.body.password;
  user.passwordResetToken = undefined; // single use
  user.passwordResetExpires = undefined;
  await user.save(); // also stamps passwordChangedAt, which signs out every existing session
  res.json({ success: true, message: 'Password updated. You can now sign in with your new password.' });
});
