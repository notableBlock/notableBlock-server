const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  editor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  blockchainRef: { type: String },
  blocks: [
    {
      tag: {
        type: String,
        required: true,
      },
      html: {
        type: String,
        required: false,
      },
      imageUrl: {
        type: String,
        required: false,
      },
    },
  ],
  baseNote: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
  shared: { type: Boolean, required: true },
});

noteSchema.set("timestamps", true);

module.exports = mongoose.model("Note", noteSchema);
