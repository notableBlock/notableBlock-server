const createError = require("http-errors");

const Note = require("../models/Note");

const findNoteById = require("../services/findNoteById");
const getCurrentDate = require("../utils/getCurrentDate");

const getNotes = async (req, res, next) => {
  const { user } = req;

  try {
    res.status(200).json({
      message: "사용자의 노트를 가져왔습니다.",
      notesId: user.notes ? user.notes.map((note) => note.toString()) : [],
    });
  } catch (err) {
    next(createError(500, "노트를 가져오는데 실패했습니다."));
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
    res.status(201).send({ noteId: savedNote._id.toString() });
  } catch (err) {
    next(createError(500, "노트를 생성하는데 실패했습니다."));
  }
};

const updateNote = async (req, res, next) => {
  const { name, picture } = req.user;
  const { noteId, blocks } = req.body.data;

  try {
    const note = await findNoteById(noteId);
    note.blocks = blocks;
    note.updatedAt = getCurrentDate();
    note.editor = name;
    note.editorPicture = picture;

    await note.save();
    res.status(200).json({ message: "노트가 업데이트 되었습니다." });
  } catch (err) {
    next(createError(500, "노트 업데이트에 실패했습니다."));
  }
};

const showNotes = async (req, res, next) => {
  const { noteId } = req.params;

  try {
    const note = await findNoteById(noteId);
    res.status(200).json(note);
  } catch (err) {
    next(createError(500, "노트를 찾을 수 없습니다."));
  }
};

module.exports = { getNotes, createNote, updateNote, showNotes };
