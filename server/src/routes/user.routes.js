const router = require("express").Router();
const ctrl = require("../controllers/user.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/search", ctrl.searchUsers);
router.get("/me/summary", ctrl.mySummary);
router.patch("/me", ctrl.updateMe);
router.get("/:username", ctrl.getProfile);

module.exports = router;
