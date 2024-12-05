const express = require("express");

const { login, autoLogin } = require("../controllers/authController");

const router = express.Router();

router.post("/", login);

router.get("/", autoLogin);

module.exports = router;
