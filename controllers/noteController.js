const createError = require("http-errors");
const fs = require("fs");
const path = require("path");
const os = require("os");

const Note = require("../models/Note");
const User = require("../models/User");

const findNoteById = require("../services/findNoteById");
const { createNoteData, createAndSaveNote } = require("../services/noteServices");
const { createNotificationData, saveNotification } = require("../services/notificationServices");
const clearImage = require("../services/uploadsServices");
const runCommand = require("../services/shellCommandServices");

const { blockToMarkdown } = require("../utils/convertBlock");
const getCurrentDate = require("../utils/getCurrentDate");

const getNotes = async (req, res, next) => {
  const { user } = req;

  try {
    res.status(200).json({
      notesId: user.notes ? user.notes.map((note) => note.toString()) : [],
    });
  } catch (err) {
    return next(createError(500, "노트를 가져오는데 실패했습니다."));
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
      null,
      "새로운 노트"
    );
    await saveNotification(newNotification, user);

    res.status(201).json({ noteId: savedNote._id.toString() });
  } catch (err) {
    return next(createError(500, "노트를 생성하는데 실패했습니다."));
  }
};

const deleteNote = async (req, res, next) => {
  const { _id: userId } = req.user;
  const { noteId } = req.params;

  try {
    const note = await Note.findById(noteId);
    if (!note) {
      return next(createError(404, "노트를 찾을 수 없습니다."));
    }

    if (userId.toString() === note.creatorId.toString()) {
      const deletedNote = await Note.findByIdAndDelete(noteId);
      const title =
        (deletedNote.blocks.find((block) => ["h1", "h2", "h3", "p"].includes(block.tag))?.html ??
          "제목이 없는") + " 노트";

      if (!deletedNote) {
return        next(createError(404, "삭제할 노트를 찾을 수 없습니다."));

      }

      const user = await User.findById(userId);
      if (!user) {
        return next(createError(404, "사용자를 찾을 수 없습니다."));
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
        null,
        title
      );
      await saveNotification(newNotification, user);

      res.status(200).json({ message: "노트를 삭제했습니다." });
    }
  } catch (err) {
    return next(createError(500, "노트를 삭제하는데 실패했습니다."));
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
      return next(createError(404, "노트를 찾을 수 없습니다."));
    }

    res.status(200).json({ message: "노트가 업데이트 되었습니다." });
  } catch (err) {
    return next(createError(500, "노트를 업데이트하는데 실패했습니다."));
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
    return next(createError(500, "노트를 공유하는데 실패했습니다."));
  }
};

const showNote = async (req, res, next) => {
  const { noteId } = req.params;

  try {
    const note = await findNoteById(noteId);
    res.status(200).json(note);
  } catch (err) {
    return next(createError(500, "노트를 찾을 수 없습니다."));
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
    return next(createError(500, "이미지를 첨부하는데 실패했습니다."));
  }
};

const removeImageFromNote = async (req, res, next) => {
  const imageName = req.params.imageName;

  if (!imageName) {
    return next(createError(404, "이미지를 찾을 수 없습니다."));
  }

  try {
    const imagePath = `images/${imageName}`;
    clearImage(imagePath);

    res.status(200).json({ message: "이미지가 정상적으로 삭제되었습니다." });
  } catch (err) {
    return next(createError(500, "이미지를 삭제하는데 실패했습니다."));
  }
};

const exportNote = async (req, res, next) => {
  const {
    user,
    user: { _id: userId },
    params: { noteId },
    zwcIds: { zwcCreatorId, zwcNoteId },
  } = req;

  try {
    const note = await findNoteById(noteId);
    const { blocks } = note;
    const title =
      (blocks.find((block) => ["h1", "h2", "h3", "p"].includes(block.tag))?.html ?? "제목이 없는") +
      " 노트";

    const markdown = blockToMarkdown(blocks);
    const newNotification = await createNotificationData(
      userId,
      noteId,
      "를 로컬로 내보냈습니다. 📤",
      null,
      title
    );

    await saveNotification(newNotification, user);

    const tempDirectory = path.join(os.tmpdir(), "notableBlock-temp");
    if (!fs.existsSync(tempDirectory)) fs.mkdirSync(tempDirectory);

    const mdFilePath = path.join(tempDirectory, `${title}.md`);
    fs.writeFileSync(mdFilePath, markdown);
    await runCommand("/usr/bin/xattr", ["-w", "user.creatorId", zwcCreatorId, mdFilePath]);
    await runCommand("/usr/bin/xattr", ["-w", "user.noteId", zwcNoteId, mdFilePath]);

    const tarFilePath = path.join(tempDirectory, `${title}.tar`);
    await runCommand("tar", ["-cf", tarFilePath, `-C`, tempDirectory, `${title}.md`]);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(title)}.tar`
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Type", "application/x-tar");

    res.download(tarFilePath, `${title}.tar`, (err) => {
      if (err) {
        return next(createError(500, "파일 전송 중 오류가 발생했습니다."));
      }

      fs.unlinkSync(mdFilePath);
      fs.unlinkSync(tarFilePath);
    });
  } catch (err) {
    console.log(`노트 내보내기 실패: ${err.message}`);
    return next(createError(500, "노트를 로컬로 내보내는데 실패했습니다."));
  }
};

const importNote = async (req, res, next) => {
  const {
    user: { _id: userId },
    mdFilesBlocks,
    blockchainIds,
    tempDirectory,
  } = req;

  try {
    const allNotes = await Promise.all(
      blockchainIds.map(async ({ decodedCreatorId, decodedNoteId }, index) => {
        const creatorId = decodedCreatorId || userId;
        const noteId = decodedNoteId || null;

        const creator = await User.findById(creatorId);
        const noteData = await createNoteData(creator, mdFilesBlocks[index]);

        if (noteId) {
          noteData.baseNote = noteId;
        }

        return await createAndSaveNote(noteData, creator);
      })
    );

    res.status(201).json({
      notes: allNotes,
    });
  } catch (err) {
    console.log(`노트 가져오기 실패: ${err.message}`);
    return next(createError(500, "노트를 로컬에서 가져오는데 실패했습니다."));
  } finally {
    await fs.promises.rm(tempDirectory, { recursive: true, force: true });
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
