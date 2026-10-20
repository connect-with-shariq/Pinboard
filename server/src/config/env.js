// Loads .env and exposes typed config. Fails fast if something required is missing.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const required = ["MONGO_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable ${key}. Copy server/.env.example to server/.env`);
    process.exit(1);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 5050,
  isProd: process.env.NODE_ENV === "production",
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  redisUrl: process.env.REDIS_URL || "",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 50,
  uploadDir: path.join(__dirname, "../../uploads"),
};
