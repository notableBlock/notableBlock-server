const fs = require("fs");
const path = require("path");
const os = require("os");
const createError = require("http-errors");

const { runCommand, getExtendedAttributes } = require("../services/shellCommandServices");

const extractTar = async (req, res, next) => {
  const { files: tarFiles, tempDirectory } = req;
  const platform = os.platform();

  if (platform === "win32") {
    return next(
      createError(
        500,
        "현재 윈도우 운영체제에선 파일 확장 속성 설정이 지원되지 않아 파일 아카이브 해제 기능 이용이 어려워요."
      )
    );
  }

  if (tarFiles.length === 0) return next(createError(400, "파일이 제공되지 않았어요."));

  try {
    await Promise.all(
      tarFiles.map(async ({ path }) => {
        await runCommand("tar", ["--xattrs", "-xvf", path, "-C", tempDirectory], true);

        fs.unlinkSync(path);
      })
    );

    const extractedFiles = await fs.promises.readdir(tempDirectory, { recursive: true });
    const mdFiles = extractedFiles.filter((file) => file.endsWith(".md"));

    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"];
    const imageFilePaths = extractedFiles.filter((filepath) =>
      imageExtensions.some((extension) => filepath.endsWith(extension))
    );

    if (mdFiles.length === 0) return next(createError(404, "마크다운 파일을 찾을 수 없어요."));

    const mdFileData = await Promise.all(
      mdFiles.map(async (file) => {
        const mdFilePath = path.join(tempDirectory, file);

        try {
          const { creatorId, noteId } = await getExtendedAttributes(platform, mdFilePath);

          return {
            mdFilePath,
            extractedCreatorId: creatorId,
            extractedNoteId: noteId,
          };
        } catch (err) {
          console.log(err);

          return {
            mdFilePath,
            extractedCreatorId: null,
            extractedNoteId: null,
          };
        }
      })
    );

    const extractedIds = mdFileData
      .filter(Boolean)
      .map(({ extractedCreatorId, extractedNoteId }) => ({ extractedCreatorId, extractedNoteId }));
    const mdFilePaths = mdFileData.filter(Boolean).map(({ mdFilePath }) => mdFilePath);

    req.extractedIds = extractedIds;
    req.mdFilePaths = mdFilePaths;
    req.imageFilePaths = imageFilePaths;

    next();
  } catch (err) {
    console.log(err);
    next(createError(500, "파일 아카이브 해제 중 오류가 발생했어요."));
  }
};

module.exports = extractTar;
