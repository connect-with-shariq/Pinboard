const multer = require("multer");
const { isProd } = require("../config/env");

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // Mongoose validation errors -> 400 with the first readable message
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)[0].message;
  }
  // Bad MongoDB id in the URL
  if (err.name === "CastError") {
    status = 400;
    message = "Invalid id";
  }
  // Duplicate unique field (username/email)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || "value";
    message = `That ${field} is already taken`;
  }
  // Upload errors (file too large etc.)
  if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "File is too large" : err.message;
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 && isProd ? "Server error" : message });
}

module.exports = { notFound, errorHandler };
