const mongoose = require("mongoose");

// One attached file (image / video / audio / pdf) — used by notes and chat messages
module.exports = new mongoose.Schema(
  {
    url: { type: String, required: true, match: /^\/uploads\/[\w.-]+$/ },
    type: { type: String, enum: ["image", "video", "audio", "file"], required: true },
    name: { type: String, maxlength: 200, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);
