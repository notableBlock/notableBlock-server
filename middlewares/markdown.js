const fs = require("fs");
const createError = require("http-errors");

const { markdownToBlocks } = require("../utils/convertBlock");

const convertMarkdownToBlocks = async (req, res, next) => {
  const mdFilePaths = req.mdFilePaths;

  try {
    const mdFilesBlocks = await Promise.all(
      mdFilePaths.map(async (path) => {
        try {
          const markdown = await fs.promises.readFile(path, "utf-8");
          const blocks = markdownToBlocks(markdown);
          await fs.promises.unlink(path);

          return blocks;
        } catch (err) {
          return null;
        }
      })
    );

    req.mdFilesBlocks = mdFilesBlocks;
    next();
  } catch (err) {
    next(createError(500, "마크다운 변환 중 오류가 발생했습니다."));
  }
};

module.exports = convertMarkdownToBlocks;
