const express = require("express");

const { getSharedNotes, readSharedNote, copySharedNote } = require("../controllers/shareController");

const validate = require("../middlewares/validate");
const { validateNoteId } = require("../middlewares/validators/noteValidators");

const router = express.Router();

router.get("/", getSharedNotes);

// 공유 노트는 누구나 접근 가능 — isNoteOwner 불필요, isShared 확인은 컨트롤러에서 수행
router.get("/:noteId", validateNoteId, validate, readSharedNote);
router.post("/:noteId", validateNoteId, validate, copySharedNote);

module.exports = router;
