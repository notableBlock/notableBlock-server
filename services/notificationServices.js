const Notification = require("../models/Notification");
const User = require("../models/User");

const getCurrentDate = require("../utils/getCurrentDate");

const storeNotification = async ({ recipientId, noteId, message, path = null, title }) => {
  const savedNotification = await Notification.create({
    recipientId,
    message: `"${title}" ${message}`,
    link: path ? `/${path}/${noteId}` : null,
    receivedAt: getCurrentDate(),
  });

  await User.updateOne({ _id: recipientId }, { $push: { notifications: savedNotification._id } });
};

const storePerRecipientNotifications = async ({
  userId,
  creatorId,
  noteId,
  messageForCreator,
  messageForEditor,
  title,
  path = null,
}) => {
  const notifications = [{ userId, noteId, message: messageForEditor }];

  const isNotCreator = userId.toString() !== creatorId.toString();

  if (isNotCreator) {
    notifications.push({
      userId: creatorId,
      noteId,
      message: messageForCreator,
    });
  }

  for (const { userId, noteId, message } of notifications) {
    await storeNotification({
      recipientId: userId,
      noteId,
      message,
      path,
      title,
    });
  }
};

module.exports = { storeNotification, storePerRecipientNotifications };
