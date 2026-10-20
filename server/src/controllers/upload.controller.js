const ApiError = require("../utils/ApiError");

// POST /api/uploads  (multipart field name: "file")
// Returns a media object ready to be put into note.media
exports.uploadFile = (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file received");

  const kind = req.file.mimetype.split("/")[0];
  res.status(201).json({
    media: {
      url: `/uploads/${req.file.filename}`,
      type: ["image", "video", "audio"].includes(kind) ? kind : "file",
      name: req.file.originalname.slice(0, 200),
      size: req.file.size,
    },
  });
};
