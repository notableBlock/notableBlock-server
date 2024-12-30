const createError = require("http-errors");

const Notification = require("../models/Notification");
const User = require("../models/User");

const sendNotification = async (req, res, next) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const notificationStream = Notification.watch();

    notificationStream.on("change", (change) => {
      res.write(`data: ${JSON.stringify(change)}\n\n`);
    });

    req.on("close", () => {
      notificationStream.close();
      res.end();
    });
  } catch (err) {
    next(createError(500, "알림을 생성하는데 실패했습니다."));
    return;
  }
};

const deleteNotification = async (req, res, next) => {
  const { _id: userId } = req.user;
  const { notificationId } = req.params;

  try {
    const deletedNotification = await Notification.findByIdAndDelete(notificationId);
    if (!deletedNotification) {
      next(createError(404, "삭제할 알림을 찾을 수 없습니다."));
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      next(createError(404, "사용자를 찾을 수 없습니다."));
      return;
    }

    const index = user.notifications.findIndex(
      (notificationId) => notificationId.toString() === deletedNotification._id.toString()
    );
    if (index !== -1) {
      user.notifications.splice(index, 1);
      await user.save();
    }

    res.status(200).json({ message: "알림을 삭제했습니다." });
  } catch (err) {
    next(createError(500, "알림을 삭제하는데 실패했습니다."));
  }
};

module.exports = { sendNotification, deleteNotification };
