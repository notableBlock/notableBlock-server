const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  picture: { type: String, required: true },
  refresh_token: { type: String, required: true },
  isGuest: { type: Boolean, default: false },
  guestToken: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  notes: [{ type: ObjectId, ref: "Note" }],
  notifications: [{ type: ObjectId, ref: "Notification" }],
});

userSchema.set("timestamps", { createdAt: true, updatedAt: false });
userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("User", userSchema);
