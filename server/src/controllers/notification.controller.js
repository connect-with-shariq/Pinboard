const Notification = require("../models/Notification");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { emitToUser } = require("../sockets");

// GET /api/notifications — latest 30
exports.list = asyncHandler(async (req, res) => {
  const [notifications, unread] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("actor", User.PUBLIC_FIELDS)
      .lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ notifications, unread });
});

// POST /api/notifications/read-all
exports.readAll = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  emitToUser(req.user._id, "notifications:changed", {});
  res.json({ ok: true });
});
