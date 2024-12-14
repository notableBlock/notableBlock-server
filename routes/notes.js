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
const uploads = require("../middlewares/uploads");
const convertMarkdown = require("../middlewares/markdown");
const { convertIdToBlockchain, convertBlockchainToId } = require("../middlewares/blockchain");
const { convertIdToZeroWidth, convertZeroWidthToId } = require("../middlewares/zeroWidthSpace");

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getNotes);

router.post("/", createNote);

router.put("/", updateNote);

router.delete("/:noteId", deleteNote);

router.patch("/:noteId", shareNote);

router.get("/:noteId", showNote);

router.get("/:noteId/download", convertIdToBlockchain, convertIdToZeroWidth, exportNote);

router.post(
  "/uploads",
  uploads.single("file"),
  convertZeroWidthToId,
  convertBlockchainToId,
  convertMarkdown,
  importNote
);

module.exports = router;
