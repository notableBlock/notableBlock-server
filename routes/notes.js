const express = require("express");

const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  showNote,
  uploadImageToNote,
  removeImageFromNote,
  exportNote,
  importNote,
} = require("../controllers/noteController");
const archiveMarkdown = require("../controllers/archiveController");

const isAuthenticated = require("../middlewares/auth");
const uploads = require("../middlewares/uploads");
const convertMarkdownToBlocks = require("../middlewares/markdown");
const {
  convertIdsToBlockchain,
  decodeBytesIdsToBlockchainIds,
} = require("../middlewares/blockchain");
const {
  convertIdsToZwcIds,
  convertZwcIdsToBytesIds,
} = require("../middlewares/zeroWidthCharacter");
const extractTar = require("../middlewares/shellCommand");
const saveImageFromTar = require("../middlewares/image");

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getNotes);

router.post("/", createNote);

router.put("/", updateNote);

router.delete("/:noteId", deleteNote);

router.patch("/:noteId", shareNote);

router.get("/:noteId", showNote);

router.post("/:noteId/images", uploads.single("file"), uploadImageToNote);

router.delete("/uploads/images/:imageName", removeImageFromNote);

router.get("/:noteId/download", convertIdsToBlockchain, convertIdsToZwcIds, exportNote);

router.post(
  "/uploads",
  uploads.single("file"),
  extractTar,
  convertMarkdownToBlocks,
  saveImageFromTar,
  convertZwcIdsToBytesIds,
  decodeBytesIdsToBlockchainIds,
  importNote
);

router.post("/uploads/archive", uploads.single("file"), archiveMarkdown);

module.exports = router;
