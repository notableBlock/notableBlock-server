const createError = require("http-errors");

const Note = require("../models/Note");
const User = require("../models/User");

const findNoteById = require("../services/findNoteById");
const storeNote = require("../services/noteServices");
const storeNotification = require("../services/notificationServices");

const getNoteTitle = require("../utils/getNoteTitle");

const shareNote = async (req, res, next) => {
  const { user, params } = req;
  const { _id: userId, name: userName } = user;
  const { noteId } = params;

  try {
    const sharedNote = await findNoteById(noteId);
    const { _id: sharedNoteId, blocks: sharedNoteBlocks, creatorId } = sharedNote;
    const title = getNoteTitle(sharedNoteBlocks);

    sharedNote.shared = !sharedNote.shared;
    await sharedNote.save();

    const message = sharedNote.shared ? "를 공유했습니다. ✅" : "공유를 취소했습니다. ⛔";
    const path = sharedNote.shared ? "shared" : null;

    const notifications = [{ userId: userId, noteId: sharedNoteId, message, path }];
    if (userId.toString() !== creatorId.toString()) {
      notifications.push({
        userId: creatorId,
        noteId: sharedNoteId,
        message: `내 노트를 ${userName}이 다시 공유했습니다. ♻️`,
        path: "shared",
      });
    }

    for (const { userId, noteId, message, path } of notifications) {
      await storeNotification({
        recipient: user,
        recipientId: userId,
        noteId,
        message,
        path,
        title,
      });
    }

    res.status(200).json({ note: sharedNote, message });
  } catch (err) {
    next(createError(500, "노트를 공유하는데 실패했습니다."));
  }
};

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

const readSharedNote = async (req, res, next) => {
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
    const { _id: originalNoteId, creatorId, blocks: originalNoteBlocks } = originalNote;

    const creator = await User.findById(creatorId);
    const title = getNoteTitle(originalNoteBlocks);

    const savedNote = await storeNote({
      creator,
      note: originalNote,
      title,
      editor: user,
      baseNoteId: originalNoteId,
    });
    const { _id: savedNoteId } = savedNote;

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

module.exports = { shareNote, getSharedNotes, readSharedNote, copySharedNote };
