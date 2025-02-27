const express = require("express");

const {
  sendNotification,
  getNotification,
  showNotification,
  deleteNotification,
  deleteAllNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", getNotification);
router.delete("/", deleteAllNotification);

router.get("/live", sendNotification);

router.get("/:notificationId", showNotification);
router.delete("/:notificationId", deleteNotification);

module.exports = router;
