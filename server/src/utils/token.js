const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn, isProd } = require("../config/env");

const COOKIE_NAME = "token";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const signToken = (userId) => jwt.sign({ sub: String(userId) }, jwtSecret, { expiresIn: jwtExpiresIn });

const verifyToken = (token) => jwt.verify(token, jwtSecret); // throws if invalid/expired

// The JWT lives in an httpOnly cookie, so page JavaScript (and XSS) can't read it
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  maxAge: SEVEN_DAYS,
};

function setAuthCookie(res, userId) {
  res.cookie(COOKIE_NAME, signToken(userId), cookieOptions);
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
}

// Read a cookie from a raw "Cookie" header (used by Socket.IO)
function readCookie(header = "", name = COOKIE_NAME) {
  const match = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

module.exports = { COOKIE_NAME, signToken, verifyToken, setAuthCookie, clearAuthCookie, readCookie };
