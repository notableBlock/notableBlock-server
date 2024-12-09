const createError = require("http-errors");

const Note = require("../models/Note");
const User = require("../models/User");

const findNoteById = require("../services/findNoteById");
const getCurrentDate = require("../utils/getCurrentDate");

const getNotes = async (req, res, next) => {
  const { user } = req;

  try {
    res.status(200).json({
      notesId: user.notes ? user.notes.map((note) => note.toString()) : [],
    });
  } catch (err) {
    next(createError(500, "노트를 가져오는데 실패했습니다."));
    return;
  }
};

const createNote = async (req, res, next) => {
  const { user } = req;

  try {
    const newNote = new Note({
      creatorId: user._id,
      creator: user.name,
      creatorPicture: user.picture,
      blocks: [],
      shared: false,
      createdAt: getCurrentDate(),
      editor: user.name,
      editorPicture: user.picture,
    });

    const savedNote = await newNote.save();
    user.notes.push(savedNote._id);

    await user.save();
    res.status(201).json({ noteId: savedNote._id.toString() });
  } catch (err) {
    next(createError(500, "노트를 생성하는데 실패했습니다."));
    return;
  }
};

const deleteNote = async (req, res, next) => {
  const { _id: userId } = req.user;
  const { noteId } = req.params;

  try {
    const note = await Note.findById(noteId);
    if (!note) {
      next(createError(404, "노트를 찾을 수 없습니다."));
      return;
    }

    if (userId.toString() === note.creatorId.toString()) {
      const deletedNote = await Note.findByIdAndDelete(noteId);
      if (!deletedNote) {
        next(createError(404, "삭제할 노트를 찾을 수 없습니다."));
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        next(createError(404, "사용자를 찾을 수 없습니다."));
        return;
      }

      const index = user.notes.indexOf(deletedNote._id);
      if (index !== -1) {
        user.notes.splice(index, 1);
        await user.save();
      }

      res.status(200).json({ message: "노트를 삭제했습니다." });
    }
  } catch (err) {
    next(createError(500, "노트를 삭제하는데 실패했습니다."));
    return;
  }
};

const updateNote = async (req, res, next) => {
  const { name, picture } = req.user;
  const { noteId, blocks } = req.body.data;

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      {
        blocks,
        updatedAt: getCurrentDate(),
        editor: name,
        editorPicture: picture,
      },
      { new: true }
    );

    if (!updatedNote) {
      next(createError(404, "노트를 찾을 수 없습니다."));
      return;
    }

    res.status(200).json({ message: "노트가 업데이트 되었습니다." });
  } catch (err) {
    next(createError(500, "노트를 업데이트하는데 실패했습니다."));
    return;
  }
};

const shareNote = async (req, res, next) => {
  const { noteId } = req.params;

  try {
    const sharedNote = await findNoteById(noteId);

    sharedNote.shared = !sharedNote.shared;
    await sharedNote.save();

    const message = sharedNote.shared ? "노트를 공유했습니다" : "노트 공유를 취소했습니다.";
    res.status(200).json({ note: sharedNote, message });
  } catch (err) {
    next(createError(500, "노트를 공유하는데 실패했습니다."));
    return;
  }
};

const showNote = async (req, res, next) => {
  const { noteId } = req.params;

  try {
    const note = await findNoteById(noteId);
    res.status(200).json(note);
  } catch (err) {
    next(createError(500, "노트를 찾을 수 없습니다."));
    return;
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote, shareNote, showNote };
