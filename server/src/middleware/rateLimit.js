const rateLimit = require("express-rate-limit");

// Slows down password guessing on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again in 15 minutes" },
});

// General API limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, slow down a little" },
});

module.exports = { authLimiter, apiLimiter };
