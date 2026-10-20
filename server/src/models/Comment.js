const mongoose = require("mongoose");

// An opinion written by any user on a public note
const commentSchema = new mongoose.Schema(
  {
    note: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: {
      type: String,
      required: [true, "Comment can't be empty"],
      trim: true,
      maxlength: [1000, "Comment is too long (max 1000 characters)"],
    },
  },
  { timestamps: true }
);

commentSchema.index({ note: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
