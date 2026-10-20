// Who is online?  Counts open connections per user (a user can have several tabs).
// Uses Redis when available so all servers share the same view; otherwise memory.
const local = new Map();
let redis = null;
const KEY = "presence:connections";

function usePresenceRedis(client) {
  redis = client;
}

// returns true if this is the user's FIRST connection (they just came online)
async function addConnection(userId) {
  if (redis) return (await redis.hincrby(KEY, userId, 1)) === 1;
  const n = (local.get(userId) || 0) + 1;
  local.set(userId, n);
  return n === 1;
}

// returns true if this was the user's LAST connection (they just went offline)
async function removeConnection(userId) {
  if (redis) {
    const n = await redis.hincrby(KEY, userId, -1);
    if (n <= 0) await redis.hdel(KEY, userId);
    return n <= 0;
  }
  const n = (local.get(userId) || 1) - 1;
  if (n <= 0) local.delete(userId);
  else local.set(userId, n);
  return n <= 0;
}

// Given user ids, returns a Set of the ones that are online
async function onlineAmong(userIds) {
  const ids = userIds.map(String);
  if (!ids.length) return new Set();
  if (redis) {
    const counts = await redis.hmget(KEY, ...ids);
    return new Set(ids.filter((_, i) => Number(counts[i]) > 0));
  }
  return new Set(ids.filter((id) => local.get(id) > 0));
}

module.exports = { usePresenceRedis, addConnection, removeConnection, onlineAmong };
