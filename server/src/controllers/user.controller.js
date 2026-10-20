const User = require("../models/User");
const Note = require("../models/Note");
const Friendship = require("../models/Friendship");
const Conversation = require("../models/Conversation");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { relationships, friendIds } = require("../services/friendship.service");
const { onlineAmong } = require("../sockets/presence");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/users/search?q=sha  — find people by username
exports.searchUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase().replace(/^@/, "");
  if (q.length < 1) return res.json({ users: [] });

  const users = await User.find({
    _id: { $ne: req.user._id },
    username: { $regex: "^" + escapeRegex(q) },
  })
    .select(User.PUBLIC_FIELDS)
    .sort({ username: 1 })
    .limit(10)
    .lean();

  const ids = users.map((u) => u._id);
  const [rel, online] = await Promise.all([relationships(req.user._id, ids), onlineAmong(ids)]);
  res.json({
    users: users.map((u) => ({ ...u, relationship: rel[String(u._id)], online: online.has(String(u._id)) })),
  });
});

// GET /api/users/me/summary — numbers for the dashboard and sidebar badges
exports.mySummary = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const [notes, published, friends, pendingRequests, unreadNotifications, convos] = await Promise.all([
    Note.countDocuments({ owner: me, board: "private" }),
    Note.countDocuments({ owner: me, board: "public" }),
    Friendship.countDocuments({ status: "accepted", $or: [{ requester: me }, { recipient: me }] }),
    Friendship.countDocuments({ status: "pending", recipient: me }),
    Notification.countDocuments({ user: me, read: false }),
    Conversation.find({ participants: me }).select("unread").lean(),
  ]);
  const unreadMessages = convos.reduce((sum, c) => sum + ((c.unread && c.unread[String(me)]) || 0), 0);
  const likesReceived = await Note.aggregate([
    { $match: { owner: me, board: "public" } },
    { $group: { _id: null, total: { $sum: { $size: "$likes" } } } },
  ]);

  res.json({
    summary: {
      notes, published, friends, pendingRequests, unreadNotifications, unreadMessages,
      likes: likesReceived[0]?.total || 0,
    },
  });
});

// PATCH /api/users/me — edit your profile
exports.updateMe = asyncHandler(async (req, res) => {
  const { bio, avatarColor } = req.body;
  if (bio !== undefined) req.user.bio = bio;
  if (avatarColor !== undefined) req.user.avatarColor = avatarColor;
  await req.user.save();
  res.json({ user: req.user });
});

// GET /api/users/:username — someone's profile and their public notes
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: String(req.params.username).toLowerCase() })
    .select(User.PUBLIC_FIELDS)
    .lean();
  if (!user) throw ApiError.notFound("User not found");

  const isMe = String(user._id) === String(req.user._id);
  const [notes, friendList, rel, online] = await Promise.all([
    Note.find({ owner: user._id, board: "public" }).sort({ createdAt: -1 }).limit(50)
      .populate("owner", User.PUBLIC_FIELDS).lean(),
    friendIds(user._id),
    isMe ? null : relationships(req.user._id, [user._id]),
    onlineAmong([user._id]),
  ]);

  res.json({
    user: {
      ...user,
      online: online.has(String(user._id)),
      relationship: isMe ? { status: "self" } : rel[String(user._id)],
      stats: {
        publicNotes: notes.length,
        friends: friendList.length,
        likes: notes.reduce((sum, n) => sum + (n.likes?.length || 0), 0),
      },
    },
    notes,
  });
});
