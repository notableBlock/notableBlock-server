const express = require("express");

const {
  sendNotification,
  getNotification,
  readNotification,
  deleteNotification,
  deleteAllNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", getNotification);
router.delete("/", deleteAllNotification);

router.get("/live", sendNotification);

router.get("/:notificationId", readNotification);
router.delete("/:notificationId", deleteNotification);

module.exports = router;
