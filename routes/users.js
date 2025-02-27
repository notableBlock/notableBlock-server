const express = require("express");

const { login, autoLogin, logout } = require("../controllers/authController");

const isAuthenticated = require("../middlewares/auth");

const router = express.Router();

router.post("/", login);

router.use(isAuthenticated);
router.get("/", autoLogin);
router.post("/logout", logout);

module.exports = router;
