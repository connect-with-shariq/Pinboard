// Express app (no server.listen here, so it is easy to test)
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { clientUrl, uploadDir, isProd } = require("./config/env");
const routes = require("./routes");
const { protect } = require("./middleware/auth");
const { apiLimiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.set("trust proxy", 1); // correct IPs behind nginx / a load balancer
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
if (!isProd) app.use(morgan("dev"));

// API
app.use("/api", apiLimiter, routes);

// Uploaded images/videos — stored in MongoDB, only for logged-in users
app.use("/uploads", require("./routes/file.routes"));
// Old files saved on disk by earlier versions still work locally
if (fs.existsSync(uploadDir)) app.use("/uploads", protect, express.static(uploadDir, { maxAge: "7d" }));

// In production, serve the built React app from the same server
if (isProd) {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get(/^\/(?!api|uploads|socket\.io).*/, (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
