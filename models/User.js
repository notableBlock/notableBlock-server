const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  picture: { type: String, required: true },
  refresh_token: { type: String, required: true },
  notes: [{ type: ObjectId, ref: "Note" }],
  notifications: [{ type: ObjectId, ref: "Notification" }],
});

userSchema.set("timestamps", { createdAt: true, updatedAt: false });

module.exports = mongoose.model("User", userSchema);
