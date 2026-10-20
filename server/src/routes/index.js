const router = require("express").Router();

router.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/notes", require("./note.routes"));
router.use("/friends", require("./friend.routes"));
router.use("/chats", require("./chat.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/uploads", require("./upload.routes"));

module.exports = router;
