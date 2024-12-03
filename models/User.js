const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nickname: { type: String, unique: true },
  picture: String,
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],
});

userSchema.set("timestamps", { createdAt: true, updatedAt: false });

module.exports = mongoose.model("User", userSchema);
