const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { setAuthCookie, clearAuthCookie } = require("../utils/token");

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) throw ApiError.badRequest("Username, email and password are required");

  const user = await User.create({ username, email, password }); // schema validates + hashes
  setAuthCookie(res, user._id);
  res.status(201).json({ user });
});

// POST /api/auth/login   (login with username OR email)
exports.login = asyncHandler(async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) throw ApiError.badRequest("Please enter your username/email and password");

  const value = String(login).trim().toLowerCase();
  const user = await User.findOne({ $or: [{ username: value }, { email: value }] }).select("+password");
  if (!user || !(await user.comparePassword(String(password)))) {
    throw ApiError.unauthorized("Wrong username/email or password");
  }

  setAuthCookie(res, user._id);
  res.json({ user });
});

// POST /api/auth/logout
exports.logout = (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
};

// GET /api/auth/me
exports.me = (req, res) => res.json({ user: req.user });
