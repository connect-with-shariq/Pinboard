const mongoose = require("mongoose");
const User = require("../models/User");
const Friendship = require("../models/Friendship");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { otherId } = require("../services/friendship.service");
const { notify } = require("../services/notification.service");
const { emitToUser } = require("../sockets");
const { onlineAmong } = require("../sockets/presence");

const FIELDS = User.PUBLIC_FIELDS;

// Tell both people to refresh their friends data
const ping = (...userIds) => userIds.forEach((id) => emitToUser(id, "friends:changed", {}));

// GET /api/friends — my friends, with online status
exports.listFriends = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const list = await Friendship.find({ status: "accepted", $or: [{ requester: me }, { recipient: me }] })
    .populate("requester recipient", FIELDS)
    .lean();

  const friends = list.map((f) => ({
    ...(String(f.requester._id) === String(me) ? f.recipient : f.requester),
    friendsSince: f.updatedAt,
  }));
  const online = await onlineAmong(friends.map((f) => f._id));
  res.json({
    friends: friends
      .map((f) => ({ ...f, online: online.has(String(f._id)) }))
      .sort((a, b) => b.online - a.online || a.username.localeCompare(b.username)),
  });
});

// GET /api/friends/requests — incoming and outgoing pending requests
exports.listRequests = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const [incoming, outgoing] = await Promise.all([
    Friendship.find({ recipient: me, status: "pending" }).sort({ createdAt: -1 }).populate("requester", FIELDS).lean(),
    Friendship.find({ requester: me, status: "pending" }).sort({ createdAt: -1 }).populate("recipient", FIELDS).lean(),
  ]);
  res.json({
    incoming: incoming.map((r) => ({ _id: r._id, user: r.requester, createdAt: r.createdAt })),
    outgoing: outgoing.map((r) => ({ _id: r._id, user: r.recipient, createdAt: r.createdAt })),
  });
});

// POST /api/friends/requests { userId } — send a friend request
exports.sendRequest = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const { userId } = req.body;
  if (!mongoose.isValidObjectId(userId)) throw ApiError.badRequest("Invalid user");
  if (String(userId) === String(me)) throw ApiError.badRequest("You can't add yourself");
  if (!(await User.exists({ _id: userId }))) throw ApiError.notFound("User not found");

  const pairKey = Friendship.pairKey(me, userId);
  const existing = await Friendship.findOne({ pairKey });

  if (existing) {
    if (existing.status === "accepted") throw ApiError.conflict("You are already friends");
    // They already asked me -> sending a request back simply accepts theirs
    if (String(existing.recipient) === String(me)) {
      existing.status = "accepted";
      await existing.save();
      notify({ user: userId, actor: me, type: "friend_accepted" });
      ping(me, userId);
      return res.json({ status: "friends", request: existing });
    }
    throw ApiError.conflict("Friend request already sent");
  }

  const request = await Friendship.create({ requester: me, recipient: userId, pairKey });
  notify({ user: userId, actor: me, type: "friend_request" });
  ping(me, userId);
  res.status(201).json({ status: "sent", request });
});

// Find a pending request that I am allowed to act on
async function findRequest(id, filter) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest("Invalid request");
  const request = await Friendship.findOne({ _id: id, status: "pending", ...filter });
  if (!request) throw ApiError.notFound("Friend request not found");
  return request;
}

// POST /api/friends/requests/:id/accept
exports.acceptRequest = asyncHandler(async (req, res) => {
  const request = await findRequest(req.params.id, { recipient: req.user._id });
  request.status = "accepted";
  await request.save();
  notify({ user: request.requester, actor: req.user._id, type: "friend_accepted" });
  ping(request.requester, req.user._id);
  res.json({ status: "friends" });
});

// POST /api/friends/requests/:id/decline
exports.declineRequest = asyncHandler(async (req, res) => {
  const request = await findRequest(req.params.id, { recipient: req.user._id });
  await request.deleteOne();
  ping(request.requester, req.user._id);
  res.json({ status: "none" });
});

// DELETE /api/friends/requests/:id — cancel a request I sent
exports.cancelRequest = asyncHandler(async (req, res) => {
  const request = await findRequest(req.params.id, { requester: req.user._id });
  await request.deleteOne();
  ping(request.recipient, req.user._id);
  res.json({ status: "none" });
});

// DELETE /api/friends/:userId — unfriend
exports.removeFriend = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const f = await Friendship.findOneAndDelete({ pairKey: Friendship.pairKey(me, req.params.userId), status: "accepted" });
  if (!f) throw ApiError.notFound("You are not friends");
  ping(otherId(f, me), me);
  res.json({ status: "none" });
});
