const router = require("express").Router();
const ctrl = require("../controllers/friend.controller");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.listFriends);
router.get("/requests", ctrl.listRequests);
router.post("/requests", ctrl.sendRequest);
router.post("/requests/:id/accept", ctrl.acceptRequest);
router.post("/requests/:id/decline", ctrl.declineRequest);
router.delete("/requests/:id", ctrl.cancelRequest);
router.delete("/:userId", ctrl.removeFriend);

module.exports = router;
