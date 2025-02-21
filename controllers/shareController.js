const createError = require("http-errors");

const Note = require("../models/Note");
const User = require("../models/User");

const findNoteById = require("../services/findNoteById");
const storeNote = require("../services/noteServices");
const storeNotification = require("../services/notificationServices");

const getNoteTitle = require("../utils/getNoteTitle");

const getSharedNotes = async (req, res, next) => {
  try {
    const sharedNotes = await Note.find({ shared: true });

    if (!sharedNotes) {
      return next(createError(404, "현재 공유된 노트가 없습니다."));
    }

    res.status(200).json({ notesId: sharedNotes.map((note) => note._id) });
  } catch (err) {
    next(createError(500, "공유 노트를 가져오는데 실패했습니다."));
  }
};

const showSharedNote = async (req, res, next) => {
  const { noteId } = req.params;

  try {
    const note = await findNoteById(noteId);

    res.status(200).json(note);
  } catch (err) {
    next(createError(500, "해당 공유 노트를 찾을 수 없습니다."));
  }
};

const copySharedNote = async (req, res, next) => {
  const { user } = req;
  const { _id: userId } = user;
  const { noteId } = req.params;

  try {
    const originalNote = await findNoteById(noteId);
    const creator = await User.findById(originalNote.creatorId);
    const savedNote = await storeNote({ creator, note: originalNote, editor: user });
    const { _id: savedNoteId, blocks: savedNoteBlocks } = savedNote;
    const title = getNoteTitle(savedNoteBlocks)

    await storeNotification({
      recipient: user,
      recipientId: userId,
      noteId: savedNoteId,
      message: "를 내 노트로 가져왔습니다. 📥",
      path: "notes",
      title,
    });

    res.status(201).json({ noteId: savedNoteId.toString() });
  } catch (err) {
    next(createError(500, "공유 노트를 내 노트로 가져오는데 실패했습니다."));
  }
};

module.exports = { getSharedNotes, showSharedNote, copySharedNote };
