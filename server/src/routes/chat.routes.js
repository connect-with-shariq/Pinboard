const router = require("express").Router();
const ctrl = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.listConversations);
router.post("/with/:userId", ctrl.openConversation);
router.get("/:id/messages", ctrl.getMessages);
router.post("/:id/messages", ctrl.sendMessage);
router.post("/:id/read", ctrl.markRead);

module.exports = router;
