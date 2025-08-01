const createError = require("http-errors");

const Notification = require("../models/Notification");
const User = require("../models/User");

const sendNotification = async (req, res, next) => {
  const { user } = req;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const notificationFilter = [{ $match: { "fullDocument.recipientId": user._id } }];
    const notificationStream = Notification.watch(notificationFilter);

    const pingInterval = setInterval(() => {
      res.write(":\n\n");
    }, 15000);

    notificationStream.on("change", (change) => {
      res.write(`data: ${JSON.stringify(change)}\n\n`);
    });

    req.on("close", () => {
      clearInterval(pingInterval);
      notificationStream.close();
      res.end();
    });
  } catch (err) {
    next(createError(500, "알림을 생성하는데 실패했어요."));
  }
};

const getNotification = async (req, res, next) => {
  const { notifications } = req.user;

  try {
    res.status(200).json({
      notificationsId: notifications
        ? notifications.map((notification) => notification.toString())
        : [],
    });
  } catch (err) {
    next(createError(500, "알림을 가져오는데 실패했어요."));
  }
};

const readNotification = async (req, res, next) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findById(notificationId);
    res.status(200).json(notification);
  } catch (err) {
    next(createError(500, "알림을 찾을 수 없어요."));
  }
};

const deleteNotification = async (req, res, next) => {
  const { _id: userId } = req.user;
  const { notificationId } = req.params;

  try {
    const deletedNotification = await Notification.findByIdAndDelete(notificationId);
    if (!deletedNotification) {
      return next(createError(404, "삭제할 알림을 찾을 수 없어요."));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "사용자를 찾을 수 없어요."));
    }

    const index = user.notifications.findIndex(
      (notificationId) => notificationId.toString() === deletedNotification._id.toString()
    );
    if (index !== -1) {
      user.notifications.splice(index, 1);
      await user.save();
    }

    res.status(200).json({ message: "알림을 삭제했어요." });
  } catch (err) {
    next(createError(500, "알림을 삭제하는데 실패했어요."));
  }
};

const deleteAllNotification = async (req, res, next) => {
  const { _id: userId } = req.user;

  try {
    await Notification.deleteMany({ recipientId: userId });
    await User.findByIdAndUpdate(userId, { notifications: [] });

    res.status(200).json({ message: "모든 알림이 삭제되었어요." });
  } catch (err) {
    next(createError(500, "전체 알림을 삭제하는데 실패했어요."));
  }
};

module.exports = {
  sendNotification,
  getNotification,
  readNotification,
  deleteNotification,
  deleteAllNotification,
};
