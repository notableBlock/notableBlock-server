const createError = require("http-errors");
const path = require("path");

const Note = require("../models/Note");
const User = require("../models/User");

const findNoteById = require("../services/findNoteById");
const { createNoteData, createAndSaveNote } = require("../services/noteServices");
const { createNotificationData, saveNotification } = require("../services/notificationServices");
const clearImage = require("../services/uploadsService");
const { blockToMarkdown } = require("../utils/convertBlock");
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

    const newNotification = await createNotificationData(
      user._id,
      savedNote._id,
      "가 생성되었습니다. 📝",
      undefined,
      "새로운 노트"
    );
    await saveNotification(newNotification, user);

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
      const title =
        (deletedNote.blocks.find((block) => ["h1", "h2", "h3", "p"].includes(block.tag))?.html ??
          "제목이 없는") + " 노트";

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

      const newNotification = await createNotificationData(
        user._id,
        deletedNote._id,
        "가 삭제되었습니다. 🗑️",
        undefined,
        title
      );
      await saveNotification(newNotification, user);

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
        id: blocks.id,
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
  const { user } = req;

  try {
    const sharedNote = await findNoteById(noteId);
    const title =
      (sharedNote.blocks.find((block) => ["h1", "h2", "h3", "p"].includes(block.tag))?.html ??
        "제목이 없는") + " 노트";
    sharedNote.shared = !sharedNote.shared;
    await sharedNote.save();

    const message = sharedNote.shared ? "를 공유했습니다 🔗" : "공유를 취소했습니다. 🔒";
    const path = sharedNote.shared ? "shared" : null;

    const notifications = [{ userId: user._id, noteId: sharedNote._id, message, path }];
    if (user._id.toString() !== sharedNote.creatorId.toString()) {
      notifications.push({
        userId: sharedNote.creatorId,
        noteId: sharedNote._id,
        message: `내 노트를 ${user.name}이 다시 공유했습니다. 🔗`,
        path: "shared",
      });
    }

    for (const notification of notifications) {
      const notificationData = await createNotificationData(
        notification.userId,
        notification.noteId,
        notification.message,
        notification.path,
        title
      );

      const recipient = await User.findById(notification.userId);
      await saveNotification(notificationData, recipient);
    }

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

const uploadImageToNote = async (req, res, next) => {
  const imageUrl = `/uploads/images/${req.file.filename}`;

  try {
    res.status(200).json({
      message: "이미지를 첨부하는데 성공했습니다.",
      imageUrl: imageUrl,
    });
  } catch (err) {
    next(createError(500, "이미지를 첨부하는데 실패했습니다."));
    return;
  }
};

const removeImageFromNote = async (req, res, next) => {
  const imageName = req.params.imageName;

  if (!imageName) {
    next(createError(404, "이미지를 찾을 수 없습니다."));
    return;
  }

  try {
    const imagePath = `images/${imageName}`;
    clearImage(imagePath);

    res.status(200).json({ message: "이미지가 정상적으로 삭제되었습니다." });
  } catch (err) {
    next(createError(500, "이미지를 삭제하는데 실패했습니다."));
    return;
  }
};

const exportNote = async (req, res, next) => {
  const { user } = req;
  const { noteId } = req.params;
  const { zwcCreatorId, zwcNoteId } = req.zwcId;

  try {
    const note = await findNoteById(noteId);
    const { blocks } = note;
    const title =
      (blocks.find((block) => ["h1", "h2", "h3", "p"].includes(block.tag))?.html ?? "제목이 없는") +
      " 노트";
    const markdown = blockToMarkdown(blocks, zwcCreatorId, zwcNoteId);
    const newNotification = await createNotificationData(
      user._id,
      noteId,
      "를 로컬로 내보냈습니다. 📤",
      undefined,
      title
    );

    await saveNotification(newNotification, user);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(title)}.md`
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Type", "text/markdown");
    res.send(markdown);
  } catch (err) {
    next(createError(500, "노트를 로컬로 내보내는데 실패했습니다."));
  }
};

const importNote = async (req, res, next) => {
  const { user, convertedMarkdown } = req;

  try {
    const isIdFromBlockchain = req.idFromBlockchain;
    const creatorId = isIdFromBlockchain ? req.idFromBlockchain.decodedCreatorId : user._id;
    const noteId = isIdFromBlockchain ? req.idFromBlockchain.decodedNoteId : null;
    const message = isIdFromBlockchain
      ? "원본이 있는 노트를 로컬에서 가져왔습니다. 📥"
      : "새 노트를 로컬에서 가져왔습니다. 📥";

    const creator = await User.findById(creatorId);
    const noteData = await createNoteData(creator, convertedMarkdown);

    if (isIdFromBlockchain) noteData.baseNote = noteId;

    const savedNote = await createAndSaveNote(noteData, user);
    const notifications = [{ userId: user._id, noteId: savedNote._id, message, path: "notes" }];

    if (isIdFromBlockchain && user._id.toString() !== creator._id.toString()) {
      notifications.push({
        userId: creator._id,
        noteId: savedNote._id,
        message: `내 노트를 ${user.name}이 다시 업로드 하였습니다. 📥`,
      });
    }

    for (const notification of notifications) {
      const notificationData = await createNotificationData(
        notification.userId,
        notification.noteId,
        notification.message,
        notification.path
      );

      const recipient = await User.findById(notification.userId);
      await saveNotification(notificationData, recipient);
    }

    res.status(201).json({
      note: savedNote,
      message: message,
    });
  } catch (err) {
    next(createError(500, "노트를 로컬에서 가져오는데 실패했습니다."));
    return;
  }
};

module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  showNote,
  uploadImageToNote,
  removeImageFromNote,
  exportNote,
  importNote,
};
