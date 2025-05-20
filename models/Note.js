const mongoose = require("mongoose");

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
      tag: {
        type: String,
        required: true,
      },
      html: {
        type: String,
      },
      imageUrl: {
        type: String,
      },
    },
  ],
  baseNote: { type: ObjectId, ref: "Note" },
  isShared: { type: Boolean, required: true },
  createdAt: { type: String, required: true },
  updatedAt: String,
});

module.exports = mongoose.model("Note", noteSchema);
