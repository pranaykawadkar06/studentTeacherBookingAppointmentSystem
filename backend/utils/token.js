import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

const parseDurationMs = (value, fallback = 24 * 60 * 60 * 1000) => {
  const m = /^(\d+)\s*([smhd])$/.exec(String(value || ''));
  if (!m) return fallback;
  return Number(m[1]) * { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2]];
};

const baseCookie = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: '/',
});

export const setAuthCookie = (res, token) =>
  res.cookie('token', token, { ...baseCookie(), maxAge: parseDurationMs(config.jwt.expiresIn) });

export const clearAuthCookie = (res) => res.clearCookie('token', baseCookie());

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// The raw token goes in the emailed link; only its hash is stored.
export const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex'); // 64 hex chars
  return { token, hash: hashToken(token) };
};
