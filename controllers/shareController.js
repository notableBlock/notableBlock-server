const createError = require("http-errors");

const Note = require("../models/Note");
const User = require("../models/User");

const findNoteById = require("../services/findNoteById");
const { createNoteData, createAndSaveNote } = require("../services/noteServices");
const { createNotificationData, saveNotification } = require("../services/notificationServices");

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

const copySharedNote = async (req, res, next) => {
  const { user } = req;
  const { noteId } = req.params;

  try {
    const originalNote = await findNoteById(noteId);
    const creator = await User.findById(originalNote.creatorId);

    const copiedNote = await createNoteData(creator, originalNote, user);
    const savedNote = await createAndSaveNote(copiedNote, user);

    const newNotification = await createNotificationData(
      user._id,
      savedNote._id,
      "를 내 노트로 가져왔습니다.",
      "notes"
    );
    await saveNotification(newNotification, user);

    res.status(201).json({ noteId: savedNote._id.toString() });
  } catch (err) {
    next(createError(500, "공유 노트를 내 노트로 가져오는데 실패했습니다."));
    return;
  }
};

module.exports = { getSharedNotes, showSharedNote, copySharedNote };
