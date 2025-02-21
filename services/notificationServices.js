const Notification = require("../models/Notification");
const User = require("../models/User");

const getCurrentDate = require("../utils/getCurrentDate");

const storeNotification = async ({ recipient, recipientId, noteId, message, path, title }) => {
  const savedNotification = await Notification.create({
    recipientId,
    message: `"${title}" ${message}`,
    link: path ? `/${path}/${noteId}` : null,
    receivedAt: getCurrentDate(),
  });

  await User.updateOne({ _id: recipient._id }, { $push: { notifications: savedNotification._id } });
};

module.exports = storeNotification;
