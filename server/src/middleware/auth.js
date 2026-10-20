const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { COOKIE_NAME, verifyToken } = require("../utils/token");

// Protects a route: reads the JWT cookie, loads the user into req.user
const protect = asyncHandler(async (req, _res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized("Session expired, please log in again");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized("Account no longer exists");

  req.user = user;
  next();
});

module.exports = { protect };
