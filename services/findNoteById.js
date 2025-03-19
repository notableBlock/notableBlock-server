const createError = require("http-errors");

const Note = require("../models/Note");

const findNoteById = async (noteId) => {
  try {
    const note = await Note.findById(noteId);

    if (!note) {
      throw createError(404, "소유한 노트가 없어요.");
    }

    return note;
  } catch (err) {
    throw createError(500, "노트를 찾을 수 없어요.");
  }
};

module.exports = findNoteById;
