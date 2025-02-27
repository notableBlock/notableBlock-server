const express = require("express");

const { getSharedNotes, readSharedNote, copySharedNote } = require("../controllers/shareController");

const router = express.Router();

router.get("/", getSharedNotes);

router.get("/:noteId", readSharedNote);
router.post("/:noteId", copySharedNote);

module.exports = router;
