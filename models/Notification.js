const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema({
  recipientId: { type: ObjectId, ref: "User", required: true },
  link: String,
  message: { type: String, required: true },
  receivedAt: { type: String, required: true },
});

module.exports = mongoose.model("Notification", notificationSchema);
