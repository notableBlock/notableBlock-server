const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  note: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
  message: { type: String, required: true },
  receivedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
