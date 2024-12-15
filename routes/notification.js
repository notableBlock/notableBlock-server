const express = require("express");

const { sendNotification } = require("../controllers/notificationController");

const router = express.Router();

router.get("/", sendNotification);

module.exports = router;
