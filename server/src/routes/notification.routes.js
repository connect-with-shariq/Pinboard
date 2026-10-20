const router = require("express").Router();
const ctrl = require("../controllers/notification.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.list);
router.post("/read-all", ctrl.readAll);

module.exports = router;
