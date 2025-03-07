const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.String, ref: "User" },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  creatorPicture: { type: mongoose.Schema.Types.String, ref: "User" },
  editor: { type: mongoose.Schema.Types.String, ref: "User" },
  editorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  editorPicture: { type: mongoose.Schema.Types.String, ref: "User" },
  blockchainRef: { type: String },
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
  baseNote: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
  shared: { type: Boolean, required: true },
  createdAt: { type: String, required: true },
  updatedAt: String,
});

module.exports = mongoose.model("Note", noteSchema);
