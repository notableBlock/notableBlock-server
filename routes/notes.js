const express = require("express");

const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  showNote,
  exportNote,
  importNote,
} = require("../controllers/noteController");

const isAuthenticated = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const convertMarkdown = require("../middlewares/convertMarkdown");

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getNotes);

router.post("/", createNote);

router.put("/", updateNote);

router.delete("/:noteId", deleteNote);

router.patch("/:noteId", shareNote);

router.get("/:noteId", showNote);

router.get("/:noteId/download", exportNote);

router.post("/upload", upload.single("file"), convertMarkdown, importNote);

module.exports = router;
