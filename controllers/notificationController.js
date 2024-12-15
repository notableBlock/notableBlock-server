const createError = require("http-errors");

const Notification = require("../models/Notification");

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
  } catch (error) {
    next(createError(500, "알림을 생성하는데 실패했습니다."))
    return;
  }
};

module.exports = { sendNotification };
