const multer = require("multer");
const { maxUploadMb } = require("../config/env");
const ApiError = require("../utils/ApiError");
const { gridFsStorage } = require("../services/fileStorage.service");

const ALLOWED = /^(image|video|audio)\/|^application\/pdf$/;

// Files are streamed straight into MongoDB (GridFS) — nothing is written to disk
const upload = multer({
  storage: gridFsStorage(),
  limits: { fileSize: maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.test(file.mimetype)
      ? cb(null, true)
      : cb(ApiError.badRequest("Only images, videos, audio or PDF files are allowed")),
});

module.exports = upload;
