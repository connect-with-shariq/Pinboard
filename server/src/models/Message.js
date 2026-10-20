const mongoose = require("mongoose");
const mediaSchema = require("./schemas/media");

// One chat message
const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: [2000, "Message is too long"], default: "" },
    media: {
      type: [mediaSchema],
      validate: [(arr) => arr.length <= 4, "At most 4 attachments per message"],
    },
  },
  { timestamps: true }
);

// Messages of a conversation, newest first (for paging back in history)
messageSchema.index({ conversation: 1, createdAt: -1 });

messageSchema.pre("validate", function requireContent() {
  if (!this.text && (!this.media || this.media.length === 0)) {
    this.invalidate("text", "Message can't be empty");
  }
});

module.exports = mongoose.model("Message", messageSchema);
