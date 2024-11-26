const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  blockchainRef: { type: String, required: true },
  title: { type: String, index: true },
  content: { type: String, required: true, index: true },
  tags: [{ type: String, index: true }],
  images: [String],
  baseNote: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
  shared: { type: Boolean, required: true },
});

noteSchema.index({ title: "text", content: "text", tags: "text" });

module.exports = mongoose.model("Note", noteSchema);
