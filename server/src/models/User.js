const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AVATAR_COLORS = ["#e57373", "#64b5f6", "#81c784", "#ffb74d", "#ba68c8", "#4db6ac", "#f06292"];

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username must be at most 20 characters"],
      match: [/^[a-z0-9_]+$/, "Username can only contain letters, numbers and _"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never returned by queries unless asked for explicitly
    },
    avatarColor: {
      type: String,
      enum: AVATAR_COLORS,
      default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    },
    bio: { type: String, trim: true, maxlength: [160, "Bio can be at most 160 characters"], default: "" },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash the password whenever it is set or changed
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove sensitive fields when sending a user as JSON
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// Fields that are safe to show to other users (never email or password)
userSchema.statics.PUBLIC_FIELDS = "username avatarColor bio lastSeen createdAt";
userSchema.statics.AVATAR_COLORS = AVATAR_COLORS;

module.exports = mongoose.model("User", userSchema);
