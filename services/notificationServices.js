const Notification = require("../models/Notification");

const getCurrentDate = require("../utils/getCurrentDate");

const createNotificationData = async (recipientId, noteId, message, path, title) => {
  return {
    recipientId: recipientId,
    message: `"${title}" ${message}`,
    link: path ? `/${path}/${noteId}` : null,
    receivedAt: getCurrentDate(),
  };
};

const saveNotification = async (notificationData, user) => {
  const newNotification = new Notification(notificationData);
  const savedNotification = await newNotification.save();
  user.notifications.push(savedNotification._id);

  await user.save();
};

module.exports = { createNotificationData, saveNotification };
