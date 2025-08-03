const fs = require("fs");
const createError = require("http-errors");

const { markdownToBlocks } = require("../utils/convertBlock");

const convertMarkdownToBlocks = async (req, res, next) => {
  const { mdFilePaths } = req;
  const s3UploadTargets = [];

  try {
    const mdFilesBlocks = await Promise.all(
      mdFilePaths.map(async (path) => {
        try {
          const markdown = await fs.promises.readFile(path, "utf-8");
          const blocks = markdownToBlocks(markdown, s3UploadTargets);
          await fs.promises.unlink(path);

          return blocks;
        } catch (err) {
          return null;
        }
      })
    );

    req.mdFilesBlocks = mdFilesBlocks;
    req.s3UploadTargets = s3UploadTargets;
    next();
  } catch (err) {
    console.log(err);
    next(createError(500, "마크다운 변환 중 오류가 발생했어요."));
  }
};

module.exports = convertMarkdownToBlocks;
