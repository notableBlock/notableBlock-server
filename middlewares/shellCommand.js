const fs = require("fs");
const path = require("path");
const os = require("os");
const createError = require("http-errors");

const runCommand = require("../services/shellCommandServices");

const extractTar = async (req, res, next) => {
  const tarFiles = req.files;

  if (!tarFiles.length) {
    return next(createError(400, "파일이 제공되지 않았어요."));
  }

  try {
    const tempDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "notableBlock-temp-"));

    await Promise.all(
      tarFiles.map(async ({ path }) => {
        await runCommand("tar", ["--xattrs", "-xvf", path, "-C", tempDirectory], true);

        fs.unlinkSync(path);
      })
    );

    const extractedFiles = await fs.promises.readdir(tempDirectory, { recursive: true });
    const mdFiles = extractedFiles.filter((file) => file.endsWith(".md"));

    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"];
    const imageFiles = extractedFiles.filter((file) =>
      imageExtensions.some((extension) => file.endsWith(extension))
    );

    if (mdFiles.length === 0) {
      return next(createError(404, "마크다운 파일을 찾을 수 없어요."));
    }

    const mdFileData = await Promise.all(
      mdFiles.map(async (file) => {
        const mdFilePath = path.join(tempDirectory, file);

        try {
          const creatorId = await runCommand(
            "/usr/bin/xattr",
            ["-p", "user.creatorId", mdFilePath],
            true
          );
          const noteId = await runCommand(
            "/usr/bin/xattr",
            ["-p", "user.noteId", mdFilePath],
            true
          );
          return {
            mdFilePath,
            extractedCreatorId: creatorId,
            extractedNoteId: noteId,
          };
        } catch (err) {
          return null;
        }
      })
    );

    const extractedIds = mdFileData
      .filter(Boolean)
      .map(({ extractedCreatorId, extractedNoteId }) => ({ extractedCreatorId, extractedNoteId }));
    const mdFilePaths = mdFileData.filter(Boolean).map(({ mdFilePath }) => mdFilePath);

    req.extractedIds = extractedIds;
    req.mdFilePaths = mdFilePaths;
    req.imageFiles = imageFiles;
    req.tempDirectory = tempDirectory;

    next();
  } catch (err) {
    next(createError(500, "파일 압축 해제 중 오류가 발생했어요."));
  }
};

module.exports = extractTar;
