const { param, body } = require("express-validator");

const { ALLOWED_BLOCK_TAGS } = require("../../constants/security");

// :noteId 파라미터 검증 — GET/DELETE/PATCH/download 공통
const validateNoteId = [
  param("noteId").isMongoId().withMessage("유효하지 않은 노트 ID입니다."),
];

// PUT /notes/ — blocks 업데이트 검증
const validateUpdateNote = [
  body("data.noteId").isMongoId().withMessage("유효하지 않은 노트 ID입니다."),
  body("data.blocks").isArray({ min: 1 }).withMessage("블록 배열이 필요합니다."),
  body("data.blocks.*.tag")
    .isIn(ALLOWED_BLOCK_TAGS)
    .withMessage("허용되지 않은 블록 태그입니다."),
  body("data.blocks.*.id").isString().notEmpty().withMessage("블록 ID가 필요합니다."),
];

// DELETE /notes/images/:imageName — S3 키 패스 트래버설 방지
const validateImageName = [
  param("imageName")
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage("유효하지 않은 이미지 이름입니다."),
];

module.exports = { validateNoteId, validateUpdateNote, validateImageName };
