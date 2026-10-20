// GET /uploads/:name — serves a file stored in MongoDB (logged-in users only)
const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { streamFile } = require("../services/fileStorage.service");

router.get("/:name", protect, streamFile); // Express also answers HEAD requests with this

module.exports = router;
