const express = require("express");

const { login, logout } = require("../controllers/authController");

const isAuthenticated = require("../middlewares/auth");

const router = express.Router();

router.post("/", login);

router.use(isAuthenticated);
router.post("/logout", logout);

module.exports = router;
