const express = require("express");

const { getSharedNotes, showSharedNote } = require("../controllers/shareController");
const isAuthenticated = require("../middlewares/auth");

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getSharedNotes);

router.get("/:noteId", showSharedNote);

module.exports = router;
