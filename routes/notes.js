const express = require("express");

const {getNotes, createNote, updateNote, showNotes} = require("../controllers/noteController");
const isAuthenticated = require("../middlewares/auth");

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getNotes);

router.post("/", createNote);

router.put("/", updateNote);

router.get("/:noteId", showNotes);

module.exports = router;
