const express = require("express");

const {
  sendNotification,
  getNotification,
  readNotification,
  deleteNotification,
  deleteAllNotification,
} = require("../controllers/notificationController");

const validate = require("../middlewares/validate");
const { validateNotificationId } = require("../middlewares/validators/notificationValidators");
const { isNotificationOwner } = require("../middlewares/authorize");

const router = express.Router();

router.get("/", getNotification);
router.delete("/", deleteAllNotification);

router.get("/live", sendNotification);

router.get("/:notificationId", validateNotificationId, validate, isNotificationOwner, readNotification);
router.delete("/:notificationId", validateNotificationId, validate, isNotificationOwner, deleteNotification);

module.exports = router;
