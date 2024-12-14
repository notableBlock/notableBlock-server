const fs = require("fs");
const createError = require("http-errors");

const { markdownToBlock } = require("../utils/convertBlock");

const convertMarkdown = (req, res, next) => {
  const filePath = req.file.path;

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      next(createError(500, "파일을 읽는데 실패했습니다."));
      return;
    }

    const convertedMarkdown = markdownToBlock(data);
    req.convertedMarkdown = convertedMarkdown;

    fs.unlink(filePath, (err) => {
      if (err) {
        next(createError(500, "파일을 삭제하는데 실패했습니다."));
        return;
      }
    });

    next();
  });
};

module.exports = convertMarkdown;
