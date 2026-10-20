// Redis is optional. With one server you don't need it.
// With several servers behind a load balancer, Redis:
//   • passes Socket.IO events between servers (a chat message sent on server A reaches a user on server B)
//   • keeps one shared list of who is online
const Redis = require("ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");
const { redisUrl } = require("./env");
const { usePresenceRedis } = require("../sockets/presence");

async function attachRedis(io) {
  if (!redisUrl) {
    console.log("ℹ️  REDIS_URL not set — running as a single instance (no Redis)");
    return null;
  }
  const pubClient = new Redis(redisUrl, { lazyConnect: true });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  // Fresh start: forget online counts left over from a previous run
  await pubClient.del("presence:connections");
  usePresenceRedis(pubClient);

  console.log("✅ Redis connected — Socket.IO can scale across servers");
  return pubClient;
}

module.exports = attachRedis;
