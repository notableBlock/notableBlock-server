const createError = require("http-errors");
const fs = require("fs");
const path = require("path");
const os = require("os");

const Note = require("../models/Note");
const User = require("../models/User");

const findNoteById = require("../services/findNoteById");
const storeNote = require("../services/noteServices");
const storeNotification = require("../services/notificationServices");
const clearImage = require("../services/uploadsServices");
const runCommand = require("../services/shellCommandServices");

const { blockToMarkdown } = require("../utils/convertBlock");
const getCurrentDate = require("../utils/getCurrentDate");
const getNoteTitle = require("../utils/getNoteTitle");

const getNotes = async (req, res, next) => {
  const { user } = req;
  const { notes: userNotes } = user;
  try {
    res.status(200).json({
      notesId: userNotes ? userNotes.map((note) => note.toString()) : [],
    });
  } catch (err) {
    next(createError(500, "노트를 가져오는데 실패했습니다."));
  }
};

const createNote = async (req, res, next) => {
  const { user } = req;
  const { _id: userId } = user;

  try {
    const savedNote = await storeNote({ creator: user, note: [], editor: user });
    const { _id: savedNoteId } = savedNote;

    await storeNotification({
      recipient: user,
      recipientId: userId,
      noteId: savedNoteId,
      message: "가 생성되었습니다. 📝",
      path: null,
      title: "새로운 노트",
    });

    res.status(201).json({ noteId: savedNoteId.toString() });
  } catch (err) {
    next(createError(500, "노트를 생성하는데 실패했습니다."));
  }
};

const deleteNote = async (req, res, next) => {
  const { _id: userId, notes: userNotes } = req.user;
  const { noteId } = req.params;
  try {
    const { _id: databaseNoteId, creatorId } = await Note.findById(noteId);
    if (!databaseNoteId) {
      return next(createError(404, "노트를 찾을 수 없습니다."));
    }

    if (userId.toString() === creatorId.toString()) {
      const deletedNote = await Note.findByIdAndDelete(noteId);
      const { blocks: deletedNoteBlocks, _id: deletedNoteId } = deletedNote;
      const title = getNoteTitle(deletedNoteBlocks);

      if (!deletedNote) {
        return next(createError(404, "삭제할 노트를 찾을 수 없습니다."));
      }

      const user = await User.findById(userId);
      if (!user) {
        return next(createError(404, "사용자를 찾을 수 없습니다."));
      }
      const deletedNoteIndex = userNotes.indexOf(deletedNoteId);
      if (deletedNoteIndex !== -1) {
        user.notes.splice(deletedNoteIndex, 1);
        await user.save();
      }

      await storeNotification({
        recipient: user,
        recipientId: userId,
        noteId: deletedNoteId,
        message: "가 삭제되었습니다. 📝",
        path: null,
        title,
      });

      res.status(200).json({ message: "노트를 삭제했습니다." });
    }
  } catch (err) {
    next(createError(500, "노트를 삭제하는데 실패했습니다."));
  }
};

const updateNote = async (req, res, next) => {
  const { name, picture } = req.user;
  const { noteId, blocks } = req.body.data;
  const { _id: blocksId } = blocks;

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      {
        blocks,
        id: blocksId,
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
    next(createError(500, "노트를 업데이트하는데 실패했습니다."));
  }
};

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

const showNote = async (req, res, next) => {
  const { noteId } = req.params;

  try {
    const note = await findNoteById(noteId);
    res.status(200).json(note);
  } catch (err) {
    next(createError(500, "노트를 찾을 수 없습니다."));
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
  }
};

const removeImageFromNote = async (req, res, next) => {
  const { imageName } = req.params;

  if (!imageName) {
    return next(createError(404, "이미지를 찾을 수 없습니다."));
  }

  try {
    const imagePath = `images/${imageName}`;
    clearImage(imagePath);

    res.status(200).json({ message: "이미지가 정상적으로 삭제되었습니다." });
  } catch (err) {
    next(createError(500, "이미지를 삭제하는데 실패했습니다."));
  }
};

const exportNote = async (req, res, next) => {
  const { user, params, zwcIds } = req;
  const { _id: userId } = user;
  const { noteId } = params;
  const { zwcCreatorId, zwcNoteId } = zwcIds;

  try {
    const { blocks } = await findNoteById(noteId);
    const title = getNoteTitle(blocks);
    const markdown = blockToMarkdown(blocks);

    const tempDirectory = path.join(os.tmpdir(), "notableBlock-temp");
    if (!fs.existsSync(tempDirectory)) fs.mkdirSync(tempDirectory);

    const mdFilePath = path.join(tempDirectory, `${title}.md`);
    fs.writeFileSync(mdFilePath, markdown);
    await runCommand("/usr/bin/xattr", ["-w", "user.creatorId", zwcCreatorId, mdFilePath]);
    await runCommand("/usr/bin/xattr", ["-w", "user.noteId", zwcNoteId, mdFilePath]);

    const tarFilePath = path.join(tempDirectory, `${title}.tar`);
    await runCommand("tar", ["-cf", tarFilePath, `-C`, tempDirectory, `${title}.md`]);

    await storeNotification({
      recipient: user,
      recipientId: userId,
      noteId,
      message: "를 로컬로 내보냈습니다. 📤",
      path: null,
      title,
    });

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
    next(createError(500, "노트를 로컬로 내보내는데 실패했습니다."));
  }
};

const importNote = async (req, res, next) => {
  const { user, mdFilesBlocks, blockchainIds, tempDirectory } = req;
  const { _id: userId } = user;

  try {
    const allNotes = await Promise.all(
      blockchainIds.map(async ({ decodedCreatorId, decodedNoteId }, index) => {
        const creatorId = decodedCreatorId || userId;
        const noteId = decodedNoteId || null;
        const creator = (await User.findById(creatorId)) || user;
        const title = getNoteTitle(mdFilesBlocks);

        await storeNotification({
          recipient: user,
          recipientId: userId,
          noteId,
          message: decodedNoteId
            ? "원본이 있는 노트를 로컬에서 가져왔습니다. 📥"
            : "를 새롭게 가져왔습니다. 📥",
          path: null,
          title,
        });

        return await storeNote({
          creator,
          note: mdFilesBlocks[index],
          editor: creator,
          baseNoteId: noteId,
        });
      })
    );

    res.status(201).json({
      notes: allNotes,
    });
  } catch (err) {
    next(createError(500, "노트를 로컬에서 가져오는데 실패했습니다."));
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
