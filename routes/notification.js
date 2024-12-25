const express = require("express");

const { sendNotification, deleteNotification } = require("../controllers/notificationController");

const router = express.Router();

router.get("/", sendNotification);

router.delete("/:notificationId", deleteNotification);

module.exports = router;
