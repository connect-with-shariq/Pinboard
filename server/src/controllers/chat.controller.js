const mongoose = require("mongoose");
const User = require("../models/User");
const Friendship = require("../models/Friendship");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { areFriends } = require("../services/friendship.service");
const { emitToUser } = require("../sockets");
const { onlineAmong } = require("../sockets/presence");

const FIELDS = User.PUBLIC_FIELDS;

// Shape a conversation for the person looking at it
function view(convo, me, online = new Set()) {
  const other = convo.participants.find((p) => String(p._id) !== String(me));
  const unread = convo.unread instanceof Map ? convo.unread.get(String(me)) : convo.unread?.[String(me)];
  const otherUnread = other
    ? (convo.unread instanceof Map ? convo.unread.get(String(other._id)) : convo.unread?.[String(other._id)]) || 0
    : 0;
  return {
    _id: convo._id,
    otherUnread, // 0 = they have read everything (used for "Seen")
    user: other ? { ...(other.toObject ? other.toObject() : other), online: online.has(String(other._id)) } : null,
    lastMessage: convo.lastMessage,
    unread: unread || 0,
    updatedAt: convo.updatedAt,
  };
}

async function getMyConversation(id, me) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest("Invalid conversation");
  const convo = await Conversation.findOne({ _id: id, participants: me }).populate("participants", FIELDS);
  if (!convo) throw ApiError.notFound("Conversation not found");
  return convo;
}

// GET /api/chats — my conversations, newest first
exports.listConversations = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const convos = await Conversation.find({ participants: me }).sort({ updatedAt: -1 }).populate("participants", FIELDS).lean();
  const others = convos.map((c) => c.participants.find((p) => String(p._id) !== String(me))?._id).filter(Boolean);
  const online = await onlineAmong(others);
  res.json({ conversations: convos.map((c) => view(c, me, online)) });
});

// POST /api/chats/with/:userId — open (or create) the chat with a friend
exports.openConversation = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId) || String(userId) === String(me)) throw ApiError.badRequest("Invalid user");
  if (!(await areFriends(me, userId))) throw ApiError.forbidden("You can only chat with friends");

  const pairKey = Friendship.pairKey(me, userId);
  // upsert = find it, or create it if it doesn't exist yet (safe if two tabs do it at once)
  const convo = await Conversation.findOneAndUpdate(
    { pairKey },
    { $setOnInsert: { pairKey, participants: [me, userId] } },
    { upsert: true, new: true }
  ).populate("participants", FIELDS);

  const online = await onlineAmong([userId]);
  res.json({ conversation: view(convo, me, online) });
});

// GET /api/chats/:id/messages?before=<ISO date> — 30 messages at a time
exports.getMessages = asyncHandler(async (req, res) => {
  const convo = await getMyConversation(req.params.id, req.user._id);
  const filter = { conversation: convo._id };
  if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };

  const LIMIT = 30;
  const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(LIMIT + 1).lean();
  const hasMore = messages.length > LIMIT;
  res.json({ messages: messages.slice(0, LIMIT).reverse(), hasMore });
});

// POST /api/chats/:id/messages { text, media } — send a message
exports.sendMessage = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const convo = await getMyConversation(req.params.id, me);
  const other = convo.participants.find((p) => String(p._id) !== String(me));
  if (!other || !(await areFriends(me, other._id))) throw ApiError.forbidden("You can only chat with friends");

  const message = await Message.create({
    conversation: convo._id,
    sender: me,
    text: req.body.text,
    media: req.body.media || [],
  });

  const preview = message.text || (message.media[0]?.type === "image" ? "📷 Photo" : "📎 Attachment");
  await Conversation.updateOne(
    { _id: convo._id },
    {
      lastMessage: { text: preview.slice(0, 120), sender: me, createdAt: message.createdAt },
      $inc: { [`unread.${other._id}`]: 1 },
    }
  );

  const payload = {
    conversationId: String(convo._id),
    message,
    from: { _id: req.user._id, username: req.user.username, avatarColor: req.user.avatarColor },
  };
  emitToUser(other._id, "message:new", payload);
  emitToUser(me, "message:new", payload); // my other tabs
  res.status(201).json({ message });
});

// POST /api/chats/:id/read — mark everything in this chat as read
exports.markRead = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const convo = await getMyConversation(req.params.id, me);
  await Conversation.updateOne({ _id: convo._id }, { $set: { [`unread.${me}`]: 0 } });
  const other = convo.participants.find((p) => String(p._id) !== String(me));
  if (other) emitToUser(other._id, "message:read", { conversationId: String(convo._id), userId: String(me), at: new Date() });
  emitToUser(me, "chats:changed", {});
  res.json({ ok: true });
});
