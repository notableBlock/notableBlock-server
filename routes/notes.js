const express = require("express");
const router = express.Router();

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
const getOwnedNotes = require("../controllers/treeController");

const dynamicUpload = require("../middlewares/upload");
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

const importNoteMiddlewares = [
  dynamicUpload("files", "array"),
  extractTar,
  convertMarkdownToBlocks,
  saveImageFromTar,
  convertZwcIdsToBytesIds,
  decodeBytesIdsToBlockchainIds,
];

router.get("/", getUserNotes);
router.post("/", createNote);
router.put("/", updateNote);

router.get("/tree", getOwnedNotes);

router.get("/:noteId", readNote);
router.delete("/:noteId", deleteNote);
router.patch("/:noteId", shareNote);
router.post("/:noteId/images", dynamicUpload("image", "single"), uploadImageToNote);
router.get("/:noteId/download", convertIdsToBlockchain, convertIdsToZwcIds, exportNote);

router.post("/uploads", ...importNoteMiddlewares, importNote);
router.post("/uploads/archive", dynamicUpload("files", "array"), archiveUploadedFiles);
router.delete("/uploads/images/:imageName", removeImageFromNote);

module.exports = router;
