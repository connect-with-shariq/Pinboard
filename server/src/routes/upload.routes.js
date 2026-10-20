const router = require("express").Router();
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadFile } = require("../controllers/upload.controller");

router.post("/", protect, upload.single("file"), uploadFile);

module.exports = router;
