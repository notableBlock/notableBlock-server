const createError = require("http-errors");
const path = require("path");
const os = require("os");
const fs = require("fs");

const User = require("../models/User");

const findNoteById = require("../services/findNoteById");
const storeNote = require("../services/noteServices");
const storeNotification = require("../services/notificationServices");
const runCommand = require("../services/shellCommandServices");

const getNoteTitle = require("../utils/getNoteTitle");
const { blockToMarkdown } = require("../utils/convertBlock");

const importNote = async (req, res, next) => {
  const { user, mdFilesBlocks, blockchainIds, tempDirectory } = req;
  const { _id: userId } = user;

  try {
    const allNotes = await Promise.all(
      blockchainIds.map(async ({ decodedCreatorId, decodedNoteId }) => {
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
          note: mdFilesBlocks,
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

const exportNote = async (req, res, next) => {
  const { user, params, zwcIds } = req;
  const { _id: userId } = user;
  const { noteId } = params;
  const { zwcCreatorId, zwcNoteId } = zwcIds;

  try {
    const { blocks } = await findNoteById(noteId);
    const title = getNoteTitle(blocks);

    const tempDirectory = path.join(os.tmpdir(), "notableBlock-temp");
    fs.mkdirSync(tempDirectory, { recursive: true });

    const assetsDirectory = path.join(tempDirectory, "assets");
    fs.mkdirSync(assetsDirectory, { recursive: true });

    const imagePaths = blocks
      .filter(({ imageUrl }) => imageUrl)
      .map(({ imageUrl }) => `public/${imageUrl}`);

    imagePaths.forEach((imagePath) => {
      const imageFilename = path.basename(imagePath);
      const assetsImagePath = path.join(assetsDirectory, imageFilename);

      fs.copyFileSync(imagePath, assetsImagePath);
    });

    const markdown = blockToMarkdown(blocks);

    const mdFilePath = path.join(tempDirectory, `${title}.md`);
    fs.writeFileSync(mdFilePath, markdown);
    await runCommand("/usr/bin/xattr", ["-w", "user.creatorId", zwcCreatorId, mdFilePath]);
    await runCommand("/usr/bin/xattr", ["-w", "user.noteId", zwcNoteId, mdFilePath]);

    const tarFilePath = path.join(tempDirectory, `${title}.tar`);
    await runCommand("tar", ["-cf", tarFilePath, "-C", tempDirectory, `${title}.md`, "assets"]);

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
      fs.rmSync(assetsDirectory, { recursive: true, force: true });
    });
  } catch (err) {
    next(createError(500, "노트를 로컬로 내보내는데 실패했습니다."));
  }
};

const archiveMarkdown = async (req, res, next) => {
  const { filename, path: uploadedFilePath } = req.file;

  if (!uploadedFilePath) {
    return next(createError(400, "업로드된 파일이 존재하지 않습니다."));
  }

  const isNotMarkdown = path.extname(filename) !== ".md";
  if (isNotMarkdown) {
    fs.unlinkSync(uploadedFilePath);
    return next(createError(500, "마크다운이 아닌 파일입니다."));
  }

  try {
    const tempDirectory = path.join(os.tmpdir(), "notableBlock-temp");
    fs.mkdirSync(tempDirectory, { recursive: true });

    const tarFilePath = path.join(tempDirectory, `${filename}.tar`);
    const mdFilePath = path.join(os.homedir(), "Downloads", filename);

    if (fs.existsSync(tarFilePath)) {
      fs.unlinkSync(tarFilePath);
    }
    if (!fs.existsSync(mdFilePath)) {
      return next(createError(404, "압축할 마크다운 파일이 다운로드 폴더에 존재하지 않습니다."));
    }

    try {
      await runCommand("tar", ["-cf", tarFilePath, "-C", path.dirname(mdFilePath), filename]);
    } catch (err) {
      return next(createError(500, "tar 압축 중 오류가 발생했습니다."));
    }

    const tarFilename = `${path.parse(filename).name}.tar`;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(tarFilename)}"; filename*=UTF-8''${encodeURIComponent(tarFilename)}`
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Type", "application/x-tar");
    res.download(tarFilePath, tarFilename, (err) => {
      if (err) {
        return next(createError(500, "파일 전송 중 오류가 발생했습니다."));
      }

      fs.unlinkSync(uploadedFilePath);
      fs.unlinkSync(tarFilePath);
    });
  } catch (err) {
    next(createError(500, "tar 압축에 실패했습니다."));
  }
};

module.exports = { importNote, exportNote, archiveMarkdown };
