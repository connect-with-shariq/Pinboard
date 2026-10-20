const mongoose = require("mongoose");
const mediaSchema = require("./schemas/media");

const NOTE_COLORS = ["#fff59d", "#ffcc80", "#a5d6a7", "#90caf9", "#f48fb1", "#ce93d8", "#ffffff"];
const BOARD_SIZE = { width: 6000, height: 4000 };

const noteSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // "private" = only on the owner's board, "public" = on the public board
    board: { type: String, enum: ["private", "public"], default: "private", index: true },

    text: { type: String, maxlength: 5000, default: "" },
    color: { type: String, enum: NOTE_COLORS, default: NOTE_COLORS[0] },

    // Where the note sits on the board
    position: {
      x: { type: Number, min: 0, max: BOARD_SIZE.width, default: 100 },
      y: { type: Number, min: 0, max: BOARD_SIZE.height, default: 100 },
    },
    zIndex: { type: Number, default: 1 },

    media: {
      type: [mediaSchema],
      validate: [(arr) => arr.length <= 10, "A note can have at most 10 attachments"],
    },

    // Publishing: a private note gets a public copy.
    //   private note.publishedNote -> the public copy
    //   public copy.sourceNote     -> the private original
    sourceNote: { type: mongoose.Schema.Types.ObjectId, ref: "Note", default: null },
    publishedNote: { type: mongoose.Schema.Types.ObjectId, ref: "Note", default: null },

    commentCount: { type: Number, default: 0 },

    // Users who liked this (public) note
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Fast lookups: "all notes on my private board" and "all public notes"
noteSchema.index({ board: 1, owner: 1 });
noteSchema.index({ board: 1, createdAt: -1 });

noteSchema.statics.COLORS = NOTE_COLORS;
noteSchema.statics.BOARD_SIZE = BOARD_SIZE;

module.exports = mongoose.model("Note", noteSchema);
