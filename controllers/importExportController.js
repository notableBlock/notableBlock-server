const createError = require("http-errors");
const path = require("path");
const os = require("os");
const fs = require("fs");

const User = require("../models/User");

const { storeNote, findNoteById } = require("../services/noteServices");
const { storePerRecipientNotifications } = require("../services/notificationServices");
const { setExtendedAttributes, createTarArchive } = require("../services/shellCommandServices");

const getNoteTitle = require("../utils/getNoteTitle");
const { blockToMarkdown } = require("../utils/convertBlock");

const importNote = async (req, res, next) => {
  const { user, mdFilesBlocks, blockchainIds, tempDirectory } = req;
  const { _id: userId, name: userName } = user;

  try {
    const allNotes = await Promise.all(
      blockchainIds.map(async ({ decodedCreatorId, decodedNoteId }, index) => {
        const creatorId = decodedCreatorId || userId;
        const noteId = decodedNoteId || null;
        const creator = (await User.findById(creatorId)) || user;
        const title = getNoteTitle(mdFilesBlocks[index]);
        const messageForCreator = `를 ${userName}이 로컬에서 가져왔어요.`;
        const messageForEditor = decodedNoteId
          ? "원본이 있는 노트를 로컬에서 가져왔어요."
          : "를 새롭게 가져왔어요.";

        await storePerRecipientNotifications({
          userId,
          creatorId,
          noteId,
          messageForCreator,
          messageForEditor,
          title,
        });

        return await storeNote({
          creator,
          note: mdFilesBlocks[index],
          editor: user,
          title,
          baseNoteId: noteId,
        });
      })
    );

    res.status(201).json({
      notes: allNotes,
    });
  } catch (err) {
    console.log(err);
    next(createError(500, "노트를 로컬에서 가져오는데 실패했어요."));
  } finally {
    await fs.promises.rm(tempDirectory, { recursive: true, force: true });
  }
};

const exportNote = async (req, res, next) => {
  const { user, params, zwcIds } = req;
  const { _id: userId, name: userName } = user;
  const { noteId } = params;
  const { zwcCreatorId, zwcNoteId } = zwcIds;
  const platform = os.platform();

  if (platform === "win32") {
    return next(
      createError(
        500,
        "현재 윈도우 운영체제에선 파일 확장 속성 설정이 지원되지 않아 로컬로 내보내기 기능 이용이 어려워요."
      )
    );
  }

  try {
    const { blocks, creatorId } = await findNoteById(noteId);

    const tempDirectory = path.join(process.env.TEMP_DIR || os.tmpdir(), "notableBlock-temp");
    const assetsDirectory = path.join(tempDirectory, "assets");
    fs.mkdirSync(tempDirectory, { recursive: true });
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
    const title = getNoteTitle(blocks);

    const tarArchivePath = path.join(tempDirectory, `${title}.tar`);
    const mdFilePath = path.join(tempDirectory, `${title}.md`);
    fs.writeFileSync(mdFilePath, markdown);

    try {
      await setExtendedAttributes(platform, mdFilePath, zwcCreatorId, zwcNoteId);
      await createTarArchive(platform, tarArchivePath, tempDirectory, `${title}.md`);
    } catch (err) {
      console.log(err);
      return next(createError(500, err.message));
    }

    const messageForEditor = "를 로컬로 내보냈어요.";
    const messageForCreator = `를 ${userName}이 로컬로 내보냈어요.`;

    await storePerRecipientNotifications({
      userId,
      creatorId,
      noteId,
      messageForCreator,
      messageForEditor,
      title,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(title)}.tar`
    );
    res.setHeader("Content-Type", "application/x-tar");
    res.download(tarArchivePath, `${title}.tar`, (err) => {
      if (err) {
        console.log(err);
        return next(createError(500, "파일 전송 중 오류가 발생했어요."));
      }

      fs.unlinkSync(mdFilePath);
      fs.unlinkSync(tarArchivePath);
      fs.rmSync(assetsDirectory, { recursive: true, force: true });
    });
  } catch (err) {
    console.log(err);
    next(createError(500, "노트를 로컬로 내보내는데 실패했어요."));
  }
};

const archiveUploadedFiles = async (req, res, next) => {
  const { files, tempDirectory, isMdFileExist } = req;
  const platform = os.platform();

  if (!isMdFileExist) {
    return next(createError(404, "마크다운 파일이 존재하지 않아요."));
  }
  try {
    const assetsDirectory = path.join(tempDirectory, "assets");
    fs.mkdirSync(assetsDirectory, { recursive: true });

    const filesData = files.map(({ filename }) => ({
      name: filename,
      fullPath: path.join(tempDirectory, filename),
    }));
    const mdFiles = filesData.filter(({ name }) => name.endsWith(".md"));
    const assetsFiles = filesData.filter(({ name }) => !name.endsWith(".md"));

    assetsFiles.forEach(({ name, fullPath }) => {
      fs.copyFileSync(fullPath, path.join(assetsDirectory, name));
    });

    const tarTitle = mdFiles.map(({ name }) => path.basename(name, ".md")).join(", ");

    if (!tarTitle) {
      return next(createError(404, "아카이브할 마크다운 파일이 없어요."));
    }

    const tarArchivePath = path.join(tempDirectory, `${tarTitle}.tar`);
    const missingFiles = filesData.filter(({ fullPath }) => !fs.existsSync(fullPath));

    if (missingFiles.length > 0) {
      return next(createError(404, "아카이브할 파일이 폴더에 존재하지 않아요."));
    }

    try {
      await createTarArchive(
        platform,
        tarArchivePath,
        tempDirectory,
        mdFiles.map(({ name }) => name)
      );
    } catch (err) {
      console.log(err);
      return next(createError(500, "아카이브 중 오류가 발생했어요."));
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(tarTitle)}"; filename*=UTF-8''${encodeURIComponent(tarTitle)}.tar`
    );
    res.setHeader("Content-Type", "application/x-tar");

    res.download(tarArchivePath, `${tarTitle}.tar`, (err) => {
      if (err) {
        console.log(err);
        return next(createError(500, "파일 전송 중 오류가 발생했어요."));
      }

      files.forEach(({ path }) => fs.unlinkSync(path));
      fs.unlinkSync(tarArchivePath);
      fs.rmSync(assetsDirectory, { recursive: true, force: true });
    });
  } catch (err) {
    console.log(err);
    next(createError(500, "아카이브에 실패했어요."));
  }
};

module.exports = { importNote, exportNote, archiveUploadedFiles };
