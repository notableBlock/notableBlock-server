const path = require("path");
const createError = require("http-errors");
const sanitizeHtml = require("sanitize-html");

const Note = require("../models/Note");
const User = require("../models/User");

const { storeNote, findNoteById } = require("../services/noteServices");
const { storeNotification } = require("../services/notificationServices");
const { deleteS3Objects } = require("../services/s3Services");

const getCurrentDate = require("../utils/getCurrentDate");
const getNoteTitle = require("../utils/getNoteTitle");

const { SANITIZE_OPTIONS } = require("../constants/security");

const getUserNotes = async (req, res, next) => {
  const { user } = req;
  const { notes: userNotes } = user;

  try {
    res.status(200).json({
      notesId: userNotes ? userNotes.map((note) => note.toString()) : [],
    });
  } catch (err) {
    next(createError(500, "노트를 가져오는데 실패했어요."));
  }
};

const createNote = async (req, res, next) => {
  const { user } = req;
  const { _id: userId } = user;

  try {
    const savedNote = await storeNote({
      creator: user,
      note: [],
      title: "제목이 없는 노트",
      editor: user,
    });
    const { _id: savedNoteId } = savedNote;

    await storeNotification({
      recipientId: userId,
      noteId: savedNoteId,
      message: "가 생성되었어요.",
      title: "새로운 노트",
    });

    res.status(201).json({ noteId: savedNoteId.toString() });
  } catch (err) {
    next(createError(500, "노트를 생성하는데 실패했어요."));
  }
};

const readNote = async (req, res, next) => {
  // isNoteOwner 미들웨어가 이미 노트를 조회하고 req.note에 저장함
  res.status(200).json(req.note);
};

const updateNote = async (req, res, next) => {
  const { name, picture } = req.user;
  const { noteId } = req.params;
  const { blocks } = req.body.data;
  const { _id: blocksId } = blocks;

  // 저장 전 html 필드를 정제 — XSS 이중 방어 (클라이언트: DOMPurify, 서버: sanitize-html)
  const sanitizedBlocks = blocks.map((block) => ({
    ...block,
    html: block.html ? sanitizeHtml(block.html, SANITIZE_OPTIONS) : block.html,
  }));

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      {
        blocks: sanitizedBlocks,
        id: blocksId,
        updatedAt: getCurrentDate(),
        title: getNoteTitle(sanitizedBlocks),
        editor: name,
        editorPicture: picture,
      },
      { new: true }
    );

    if (!updatedNote) {
      return next(createError(404, "노트를 찾을 수 없어요."));
    }

    res.status(200).json({ message: "노트가 업데이트 되었어요." });
  } catch (err) {
    next(createError(500, "노트를 업데이트하는데 실패했어요."));
  }
};

const deleteNote = async (req, res, next) => {
  const { _id: userId, notes: userNotes } = req.user;
  const { noteId } = req.params;
  try {
    // isNoteOwner 미들웨어가 이미 조회한 노트를 재사용
    const { editorId } = req.note;

    // editor 우선 정책: creator라도 editor가 아니면 삭제 권한 없음
    if (userId.toString() !== editorId.toString()) {
      return next(createError(403, "노트 편집자만 삭제할 수 있어요."));
    }

    const deletedNote = await Note.findByIdAndDelete(noteId);
    if (!deletedNote) return next(createError(404, "삭제할 노트를 찾을 수 없어요."));

    const { blocks: deletedNoteBlocks, _id: deletedNoteId } = deletedNote;
    const title = getNoteTitle(deletedNoteBlocks);

    const s3Keys = deletedNoteBlocks
      .filter(({ tag }) => tag === "img")
      .map(({ imageUrl }) => imageUrl.split("/").pop());

    await deleteS3Objects(s3Keys);

    const user = await User.findById(userId);
    if (!user) return next(createError(404, "사용자를 찾을 수 없어요."));

    const deletedNoteIndex = userNotes.indexOf(deletedNoteId);
    if (deletedNoteIndex !== -1) {
      user.notes.splice(deletedNoteIndex, 1);
      await user.save();
    }

    await storeNotification({
      recipientId: userId,
      noteId: deletedNoteId,
      message: "가 삭제되었어요.",
      title,
    });

    res.status(200).json({ message: "노트를 삭제했어요." });
  } catch (err) {
    next(createError(500, "노트를 삭제하는데 실패했어요."));
  }
};

module.exports = {
  getUserNotes,
  createNote,
  readNote,
  updateNote,
  deleteNote,
};
