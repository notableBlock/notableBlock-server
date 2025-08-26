const express = require("express");

const { login, e2eLogin, logout } = require("../controllers/authController");

const isAuthenticated = require("../middlewares/auth");

const router = express.Router();

router.post("/", login);
router.post("/e2e", e2eLogin);

router.use(isAuthenticated);
router.post("/logout", logout);

module.exports = router;
