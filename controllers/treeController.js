const createError = require("http-errors");

const Note = require("../models/Note");

const getOwnedNotes = async (req, res, next) => {
  const { user } = req;

  try {
    const ownedNotes = await Note.find({
      $or: [{ creatorId: user._id }, { editorId: user._id }],
    });

    res.status(200).json({ ownedNotes });
  } catch {
    next(createError(500, "원본 소유자가 소유한 노트를 찾을 수 없어요."));
  }
};

module.exports = getOwnedNotes;
