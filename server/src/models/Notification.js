const mongoose = require("mongoose");

const TYPES = ["friend_request", "friend_accepted", "comment", "like"];

// Something happened that a user should know about (shown under the bell icon)
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who receives it
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who caused it
    type: { type: String, enum: TYPES, required: true },
    note: { type: mongoose.Schema.Types.ObjectId, ref: "Note", default: null },
    text: { type: String, maxlength: 140, default: "" }, // short preview, e.g. the comment
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
// Clean up automatically after 60 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 3600 });

module.exports = mongoose.model("Notification", notificationSchema);
