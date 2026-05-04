const mongoose = require("mongoose");

const { ALLOWED_BLOCK_TAGS } = require("../constants/security");

const { ObjectId } = mongoose.Schema.Types;

const noteSchema = new mongoose.Schema({
  creator: { type: String, required: true },
  creatorId: { type: ObjectId, ref: "User", required: true },
  editor: { type: String, required: true },
  editorId: { type: ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  blocks: [
    {
      _id: false,
      id: { type: String, required: true },
      // Mongoose 레벨 enum — express-validator 검증과 이중 방어
      tag: {
        type: String,
        required: true,
        enum: ALLOWED_BLOCK_TAGS,
      },
      html: {
        type: String,
      },
      imageUrl: {
        type: String,
      },
      // todo 블록 체크 상태 (기본값 false; todo 외 블록에서는 무시)
      checked: {
        type: Boolean,
        default: false,
      },
    },
  ],
  baseNote: { type: ObjectId, ref: "Note" },
  isShared: { type: Boolean, required: true },
  createdAt: { type: String, required: true },
  updatedAt: String,
});

module.exports = mongoose.model("Note", noteSchema);
