const mongoose = require("mongoose");

// A friend request. When accepted, the two users are friends.
//   requester -> sent the request
//   recipient -> received it
const friendshipSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted"], default: "pending", index: true },
    // "smallerId_biggerId" — the same for both directions, so a pair can only have ONE friendship
    pairKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

friendshipSchema.index({ requester: 1, status: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });

friendshipSchema.statics.pairKey = (a, b) => [String(a), String(b)].sort().join("_");

module.exports = mongoose.model("Friendship", friendshipSchema);
