const router = require("express").Router();
const ctrl = require("../controllers/note.controller");
const { protect } = require("../middleware/auth");

router.use(protect); // every note route needs a logged-in user

router.route("/").get(ctrl.getNotes).post(ctrl.createNote);
router.get("/recent", ctrl.getRecentPublic);
router.route("/:id").patch(ctrl.updateNote).delete(ctrl.deleteNote);
router.post("/:id/publish", ctrl.publishNote);
router.post("/:id/like", ctrl.toggleLike);
router.route("/:id/comments").get(ctrl.getComments).post(ctrl.addComment);

module.exports = router;
