const express = require("express");

const {
  sendNotification,
  getNotification,
  showNotification,
  deleteNotification,
} = require("../controllers/notificationController");

const isAuthenticated = require("../middlewares/auth");

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getNotification);

router.get("/live", sendNotification);

router.get("/:notificationId", showNotification);

router.delete("/:notificationId", deleteNotification);

module.exports = router;
