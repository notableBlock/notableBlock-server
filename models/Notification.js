const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  link: String,
  message: { type: String, required: true },
  receivedAt: String,
});

module.exports = mongoose.model("Notification", notificationSchema);
