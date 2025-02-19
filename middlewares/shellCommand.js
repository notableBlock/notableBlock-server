const fs = require("fs");
const path = require("path");
const os = require("os");
const createError = require("http-errors");

const runCommand = require("../services/shellCommandServices");

const extractTarAndReadIds = async (req, res, next) => {
  const tarFilePath = req.file.path;

  if (!tarFilePath) {
    return next(createError(400, "파일이 제공되지 않았습니다."));
  }

  try {
    const tempDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "notableBlock-temp-"));

    await runCommand("tar", ["--xattrs", "-xvf", tarFilePath, "-C", tempDirectory], true);

    const files = await fs.promises.readdir(tempDirectory, { recursive: true });
    const mdFiles = files.filter((file) => file.endsWith(".md"));

    if (mdFiles.length === 0) {
      return next(createError(404, "마크다운 파일을 찾을 수 없습니다."));
    }

    const mdFileData = await Promise.all(
      mdFiles.map(async (file) => {
        const mdFilePaths = path.join(tempDirectory, file);

        try {
          // /usr/bin/xattr로 해야하나?
          const creatorId = await runCommand(
            "/usr/bin/xattr",
            ["-p", "user.creatorId", mdFilePaths],
            true
          );
          const noteId = await runCommand(
            "/usr/bin/xattr",
            ["-p", "user.noteId", mdFilePaths],
            true
          );
          return {
            mdFilePaths,
            extractedCreatorId: creatorId,
            extractedNoteId: noteId,
          };
        } catch (err) {
          console.log(`속성 읽기 오류: ${err.message}`);
          return null;
        }
      })
    );

    fs.unlinkSync(tarFilePath);

    const extractedIds = mdFileData
      .filter(Boolean)
      .map(({ extractedCreatorId, extractedNoteId }) => ({ extractedCreatorId, extractedNoteId }));
    const mdFilePaths = mdFileData.filter(Boolean).map(({ mdFilePaths }) => mdFilePaths);

    req.extractedIds = extractedIds;
    req.mdFilePaths = mdFilePaths;
    req.tempDirectory = tempDirectory;
    next();
  } catch (err) {
    console.log(`압축 해제 실패: ${err.message}`);
    return next(createError(500, "파일 압축 해제 중 오류가 발생했습니다."));
  }
};

module.exports = { extractTarAndReadIds };
