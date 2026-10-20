const mongoose = require("mongoose");

// A private chat between two friends
const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: [(arr) => arr.length === 2, "A conversation has exactly 2 people"],
      index: true,
    },
    pairKey: { type: String, required: true, unique: true }, // one conversation per pair
    lastMessage: {
      text: { type: String, default: "" },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      createdAt: { type: Date, default: null },
    },
    // unread count per user id, e.g. { "<userId>": 3 }
    unread: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
