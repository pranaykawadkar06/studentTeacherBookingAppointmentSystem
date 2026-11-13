import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'test',
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.', code: 'RATE_LIMITED' },
});
