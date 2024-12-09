const createError = require("http-errors");

const Note = require("../models/Note");

const findNoteById = require("../services/findNoteById");

const getSharedNotes = async (req, res, next) => {
  try {
    const sharedNotes = await Note.find({ shared: true });

    if (!sharedNotes) {
      next(createError(404, "현재 공유된 노트가 없습니다."));
      return;
    }

    res.status(200).json({ notesId: sharedNotes.map((note) => note._id) });
  } catch (err) {
    next(createError(500, "공유 노트를 가져오는데 실패했습니다."));
    return;
  }
};

const showSharedNote = async (req, res, next) => {
  const { noteId } = req.params;

  try {
    const note = await findNoteById(noteId);

    res.status(200).json(note);
  } catch (err) {
    next(createError(500, "해당 공유 노트를 찾을 수 없습니다."));
    return;
  }
};

module.exports = { getSharedNotes, showSharedNote };
