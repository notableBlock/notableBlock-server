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
  archiveUploadedFiles,
} = require("../controllers/importExportController");

const upload = require("../middlewares/upload");
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
  upload.array("files"),
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
router.post("/:noteId/images", upload.single("image"), uploadImageToNote);
router.get("/:noteId/download", convertIdsToBlockchain, convertIdsToZwcIds, exportNote);

router.post("/uploads", ...importNoteMiddlewares, importNote);
router.post("/uploads/archive", upload.array("files"), archiveUploadedFiles);
router.delete("/uploads/images/:imageName", removeImageFromNote);

module.exports = router;
