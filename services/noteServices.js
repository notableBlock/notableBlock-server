const createError = require("http-errors");

const Note = require("../models/Note");

const getCurrentDate = require("../utils/getCurrentDate");

const createNoteData = async (creator, note, editor = creator) => {
  if (!creator) next(createError(500, "노트를 생성하는데 실패했습니다."));

  return {
    creatorId: creator._id,
    creator: creator.name,
    creatorPicture: creator.picture,
    blocks: note.blocks ? note.blocks : note,
    shared: false,
    createdAt: getCurrentDate(),
    editor: editor.name,
    editorPicture: editor.picture,
    baseNote: note._id,
    updatedAt: getCurrentDate(),
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
