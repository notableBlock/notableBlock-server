const Note = require("../models/Note");

const getCurrentDate = require("../utils/getCurrentDate");

const createNoteData = async (user, blocks) => {
  return {
    creator: user.name,
    creatorId: user._id,
    creatorPicture: user.picture,
    blocks: blocks,
    shared: false,
    createdAt: getCurrentDate(),
    editor: user.name,
    editorPicture: user.picture,
  };
};

const createAndSaveNote = async (noteData, user) => {
  const note = new Note(noteData);
  const savedNote = await note.save();
  user.notes.push(savedNote._id);
  await user.save();

  return savedNote;
};

module.exports = { createNoteData, createAndSaveNote };
