// Helpers for "are these two friends?" questions
const Friendship = require("../models/Friendship");

const otherId = (f, me) => (String(f.requester) === String(me) ? f.recipient : f.requester);

// All friend ids of a user
async function friendIds(userId) {
  const list = await Friendship.find({ status: "accepted", $or: [{ requester: userId }, { recipient: userId }] })
    .select("requester recipient")
    .lean();
  return list.map((f) => String(otherId(f, userId)));
}

async function areFriends(a, b) {
  return !!(await Friendship.exists({ pairKey: Friendship.pairKey(a, b), status: "accepted" }));
}

// Relationship between me and many other users at once:
//   { [otherId]: { status: "friends" | "sent" | "received" | "none", requestId } }
async function relationships(me, otherIds) {
  const keys = otherIds.map((id) => Friendship.pairKey(me, id));
  const found = await Friendship.find({ pairKey: { $in: keys } }).lean();
  const byKey = new Map(found.map((f) => [f.pairKey, f]));

  const result = {};
  for (const id of otherIds) {
    const f = byKey.get(Friendship.pairKey(me, id));
    let status = "none";
    if (f && f.status === "accepted") status = "friends";
    else if (f) status = String(f.requester) === String(me) ? "sent" : "received";
    result[String(id)] = { status, requestId: f ? f._id : null };
  }
  return result;
}

module.exports = { friendIds, areFriends, relationships, otherId };
