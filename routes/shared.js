const express = require("express");

const { getSharedNotes, showSharedNote, copySharedNote } = require("../controllers/shareController");
const isAuthenticated = require("../middlewares/auth");

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getSharedNotes);

router.get("/:noteId", showSharedNote);

router.post("/:noteId", copySharedNote);

module.exports = router;
