const createError = require("http-errors");

const Note = require("../models/Note");
const User = require("../models/User");

const getCurrentDate = require("../utils/getCurrentDate");

const storeNote = async ({ creator, note, title, editor, baseNoteId = null }) => {
  if (!creator) {
    next(createError(500, "노트를 생성하는데 실패했습니다."));
  }

  const savedNote = await Note.create({
    creatorId: creator._id,
    creator: creator.name,
    creatorPicture: creator.picture,
    title,
    blocks: note.blocks ? note.blocks : note,
    shared: false,
    createdAt: getCurrentDate(),
    editor: editor.name,
    editorPicture: editor.picture,
    baseNote: baseNoteId,
    updatedAt: getCurrentDate(),
  });

  await User.updateOne(
    { _id: editor._id },
    {
      $push: { notes: savedNote._id },
    }
  );

  return savedNote;
};

module.exports = storeNote;
