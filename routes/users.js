const express = require("express");

const { login, autoLogin, logout } = require("../controllers/authController");

const isAuthenticated = require("../middlewares/auth");

const router = express.Router();

router.post("/", login);

router.get("/", isAuthenticated, autoLogin);

router.post("/logout", isAuthenticated, logout);

module.exports = router;
