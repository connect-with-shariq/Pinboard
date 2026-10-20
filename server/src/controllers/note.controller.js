const Note = require("../models/Note");
const Comment = require("../models/Comment");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const { emitNote } = require("../sockets");
const { notify } = require("../services/notification.service");
const { deleteUnusedFiles } = require("../services/fileStorage.service");

const OWNER_FIELDS = User.PUBLIC_FIELDS;
const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
// Stacking order: newer/moved notes get a higher number (grows 10 per second, no extra DB query)
const nextZ = () => Math.floor((Date.now() - 1.7e12) / 100);

async function findOwnNote(id, userId) {
  const note = await Note.findById(id);
  if (!note) throw ApiError.notFound("Note not found");
  if (!note.owner.equals(userId)) throw ApiError.forbidden("You can only change your own notes");
  return note;
}

// GET /api/notes?board=private|public
exports.getNotes = asyncHandler(async (req, res) => {
  const board = req.query.board === "public" ? "public" : "private";
  const filter = board === "public" ? { board } : { board, owner: req.user._id };
  const notes = await Note.find(filter).sort({ zIndex: 1 }).limit(1000).populate("owner", OWNER_FIELDS);
  res.json({ notes });
});

// GET /api/notes/recent — newest public notes (for the home dashboard)
exports.getRecentPublic = asyncHandler(async (_req, res) => {
  const notes = await Note.find({ board: "public" }).sort({ createdAt: -1 }).limit(6).populate("owner", OWNER_FIELDS);
  res.json({ notes });
});

// POST /api/notes   — on your private board, or on the public board
exports.createNote = asyncHandler(async (req, res) => {
  const { board = "private", text = "", color, position = {}, media = [] } = req.body;
  const { width, height } = Note.BOARD_SIZE;

  const note = await Note.create({
    owner: req.user._id,
    board: board === "public" ? "public" : "private",
    text,
    color,
    media,
    position: { x: clamp(position.x, 0, width - 240), y: clamp(position.y, 0, height - 140) },
    zIndex: nextZ(),
  });
  await note.populate("owner", OWNER_FIELDS);

  emitNote(note, "note:created", note);
  res.status(201).json({ note });
});

// PATCH /api/notes/:id   — text, color, media, position (owner only)
exports.updateNote = asyncHandler(async (req, res) => {
  const note = await findOwnNote(req.params.id, req.user._id);
  const { text, color, media, position } = req.body;
  const { width, height } = Note.BOARD_SIZE;

  const oldUrls = note.media.map((m) => m.url);
  if (text !== undefined) note.text = text;
  if (color !== undefined) note.color = color;
  if (media !== undefined) note.media = media;
  if (position) {
    note.position = { x: clamp(position.x, 0, width - 240), y: clamp(position.y, 0, height - 140) };
    note.zIndex = nextZ(); // bring moved note to the front
  }
  await note.save();
  await note.populate("owner", OWNER_FIELDS);

  emitNote(note, "note:updated", note);
  res.json({ note });

  // Attachments removed from the note -> delete their files from MongoDB if nothing else uses them
  if (media !== undefined) {
    const kept = new Set(note.media.map((m) => m.url));
    deleteUnusedFiles(oldUrls.filter((u) => !kept.has(u)));
  }
});

// DELETE /api/notes/:id
exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await findOwnNote(req.params.id, req.user._id);

  await Promise.all([note.deleteOne(), Comment.deleteMany({ note: note._id })]);

  // Deleting a public copy "unpublishes" the private original
  if (note.sourceNote) {
    const original = await Note.findByIdAndUpdate(note.sourceNote, { publishedNote: null }, { new: true })
      .populate("owner", OWNER_FIELDS);
    if (original) emitNote(original, "note:updated", original);
  }

  emitNote(note, "note:deleted", { _id: note._id });
  res.json({ message: "Note deleted" });
  deleteUnusedFiles(note.media.map((m) => m.url)); // runs after the response, never blocks the user
});

// POST /api/notes/:id/publish — copies your private note to the public board
exports.publishNote = asyncHandler(async (req, res) => {
  const note = await findOwnNote(req.params.id, req.user._id);
  if (note.board === "public") throw ApiError.badRequest("This note is already public");
  if (note.publishedNote && (await Note.exists({ _id: note.publishedNote }))) {
    throw ApiError.conflict("This note is already published");
  }

  const copy = await Note.create({
    owner: note.owner,
    board: "public",
    text: note.text,
    color: note.color,
    media: note.media,
    position: { x: 100 + Math.floor(Math.random() * 1500), y: 100 + Math.floor(Math.random() * 800) },
    zIndex: nextZ(),
    sourceNote: note._id,
  });
  note.publishedNote = copy._id;
  await note.save();

  await Promise.all([copy.populate("owner", OWNER_FIELDS), note.populate("owner", OWNER_FIELDS)]);
  emitNote(copy, "note:created", copy);
  emitNote(note, "note:updated", note);
  res.status(201).json({ note: copy });
});

// GET /api/notes/:id/comments
exports.getComments = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note || note.board !== "public") throw ApiError.notFound("Public note not found");
  const comments = await Comment.find({ note: note._id }).sort({ createdAt: 1 }).populate("author", OWNER_FIELDS);
  res.json({ comments });
});

// POST /api/notes/:id/comments — anyone logged in can give their opinion on a public note
exports.addComment = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note || note.board !== "public") throw ApiError.notFound("Public note not found");

  const comment = await Comment.create({ note: note._id, author: req.user._id, text: req.body.text });
  await Note.updateOne({ _id: note._id }, { $inc: { commentCount: 1 } });
  await comment.populate("author", OWNER_FIELDS);

  emitNote(note, "comment:created", { noteId: note._id, comment });
  notify({ user: note.owner, actor: req.user._id, type: "comment", note: note._id, text: comment.text });
  res.status(201).json({ comment });
});

// POST /api/notes/:id/like — like / unlike a public note (toggle)
exports.toggleLike = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note || note.board !== "public") throw ApiError.notFound("Public note not found");

  const liked = note.likes.some((id) => id.equals(req.user._id));
  // $addToSet / $pull are atomic, so two people liking at the same moment both count
  const updated = await Note.findByIdAndUpdate(
    note._id,
    liked ? { $pull: { likes: req.user._id } } : { $addToSet: { likes: req.user._id } },
    { new: true }
  ).populate("owner", OWNER_FIELDS);

  emitNote(updated, "note:updated", updated);
  if (!liked) notify({ user: note.owner, actor: req.user._id, type: "like", note: note._id, text: note.text });
  res.json({ note: updated, liked: !liked });
});
