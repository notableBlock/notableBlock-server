const express = require("express");

const {
  getUserNotes,
  createNote,
  updateNote,
  deleteNote,
  readNote,
} = require("../controllers/noteController");
const { shareNote } = require("../controllers/shareController");
const { uploadImageToNote, removeImageFromNote } = require("../controllers/imageController");
const {
  importNote,
  exportNote,
  archiveMarkdown,
} = require("../controllers/importExportController");

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
const importNoteMiddlewares = [
  uploads.single("file"),
  extractTar,
  convertMarkdownToBlocks,
  saveImageFromTar,
  convertZwcIdsToBytesIds,
  decodeBytesIdsToBlockchainIds,
];

router.get("/", getUserNotes);
router.post("/", createNote);
router.put("/", updateNote);

router.get("/:noteId", readNote);
router.delete("/:noteId", deleteNote);
router.patch("/:noteId", shareNote);
router.post("/:noteId/images", uploads.single("file"), uploadImageToNote);
router.get("/:noteId/download", convertIdsToBlockchain, convertIdsToZwcIds, exportNote);

router.post("/uploads", ...importNoteMiddlewares, importNote);
router.post("/uploads/archive", uploads.single("file"), archiveMarkdown);
router.delete("/uploads/images/:imageName", removeImageFromNote);

module.exports = router;
