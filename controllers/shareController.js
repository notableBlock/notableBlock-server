const createError = require("http-errors");

const Note = require("../models/Note");
const User = require("../models/User");

const findNoteById = require("../services/findNoteById");
const { storeNote, processImageBlock } = require("../services/noteServices");
const {
  storeNotification,
  storePerRecipientNotifications,
} = require("../services/notificationServices");

const getNoteTitle = require("../utils/getNoteTitle");

const shareNote = async (req, res, next) => {
  const { user, params } = req;
  const { _id: userId, name: userName } = user;
  const { noteId } = params;

  try {
    const sharedNote = await findNoteById(noteId);
    const { _id: sharedNoteId, blocks: sharedNoteBlocks, creatorId } = sharedNote;
    const title = getNoteTitle(sharedNoteBlocks);

    sharedNote.isShared = !sharedNote.isShared;
    await sharedNote.save();

    const messageForCreator = `를 ${userName}이 다시 공유했어요.`;
    const messageForEditor = sharedNote.isShared ? "를 공유했어요." : "공유를 취소했어요.";
    const path = sharedNote.isShared ? "shared" : null;

    await storePerRecipientNotifications({
      userId,
      creatorId,
      noteId: sharedNoteId,
      messageForCreator,
      messageForEditor,
      title,
      path,
    });

    res.status(200).json({ note: sharedNote, messageForEditor });
  } catch (err) {
    next(createError(500, "노트를 공유하는데 실패했어요."));
  }
};

const getSharedNotes = async (req, res, next) => {
  try {
    const sharedNotes = await Note.find({ isShared: true });

    if (!sharedNotes) {
      return next(createError(404, "현재 공유된 노트가 없어요."));
    }

    res.status(200).json({ notesId: sharedNotes.map((note) => note._id) });
  } catch (err) {
    next(createError(500, "공유 노트를 가져오는데 실패했어요."));
  }
};

const readSharedNote = async (req, res, next) => {
  const { noteId } = req.params;

  try {
    const note = await findNoteById(noteId);

    res.status(200).json(note);
  } catch (err) {
    console.log(err);
    next(createError(500, "해당 공유 노트를 찾을 수 없어요."));
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
    const newBlocks = await processImageBlock(originalNoteBlocks);

    const savedNote = await storeNote({
      creator,
      note: { ...originalNote, blocks: newBlocks },
      title,
      editor: user,
      baseNoteId: originalNoteId,
    });
    const { _id: savedNoteId } = savedNote;

    await storeNotification({
      recipientId: userId,
      noteId: savedNoteId,
      message: "를 내 노트로 가져왔어요.",
      path: "notes",
      title,
    });

    res.status(201).json({ noteId: savedNoteId.toString() });
  } catch (err) {
    console.log(err);
    next(createError(500, "공유 노트를 내 노트로 가져오는데 실패했어요."));
  }
};

module.exports = { shareNote, getSharedNotes, readSharedNote, copySharedNote };
