import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
});

export const toggleLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 30, // 30 toggles per minute per user
  message: 'Too many toggle requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
