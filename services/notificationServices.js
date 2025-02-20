const Notification = require("../models/Notification");

const getCurrentDate = require("../utils/getCurrentDate");

const storeNotification = async ({ recipient, recipientId, noteId, message, path, title }) => {
  const notificationData = {
    recipientId,
    message: `"${title}" ${message}`,
    link: path ? `/${path}/${noteId}` : null,
    receivedAt: getCurrentDate(),
  };

  const newNotification = new Notification(notificationData);
  const savedNotification = await newNotification.save();

  recipient.notifications.push(savedNotification._id);

  await recipient.save();
};

module.exports = storeNotification;

