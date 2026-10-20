// An error with an HTTP status code. Throw it anywhere; errorHandler turns it into JSON.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }

  static badRequest(msg = "Bad request") { return new ApiError(400, msg); }
  static unauthorized(msg = "Please log in") { return new ApiError(401, msg); }
  static forbidden(msg = "You are not allowed to do that") { return new ApiError(403, msg); }
  static notFound(msg = "Not found") { return new ApiError(404, msg); }
  static conflict(msg = "Already exists") { return new ApiError(409, msg); }
}

module.exports = ApiError;
