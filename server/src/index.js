// Entry point: connect DB -> create HTTP server -> attach Socket.IO (+ Redis) -> listen
const http = require("http");
const mongoose = require("mongoose");
const { port } = require("./config/env");
const connectDB = require("./config/db");
const attachRedisAdapter = require("./config/redis");
const app = require("./app");
const { initSockets } = require("./sockets");

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = initSockets(server);
  await attachRedisAdapter(io);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `❌ Port ${port} is already in use.\n` +
          `   • Find what's using it:  lsof -i :${port}   (Windows: netstat -ano | findstr :${port})\n` +
          `   • Or change PORT in server/.env (and the API port in client/vite.config.js)\n` +
          `   • On macOS, port 5000 is taken by AirPlay Receiver.`
      );
    } else {
      console.error("❌ Server error:", err.message);
    }
    process.exit(1);
  });

  server.listen(port, () => console.log(`🚀 API running on http://localhost:${port}`));

  // Graceful shutdown (Ctrl+C, Docker stop)
  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down…`);
    io.close();
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("❌ Failed to start:", err.message);
  process.exit(1);
});
