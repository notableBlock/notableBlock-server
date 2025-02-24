const createError = require("http-errors");
const path = require("path");
const os = require("os");
const fs = require("fs");

const runCommand = require("../services/shellCommandServices");

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

module.exports = archiveMarkdown;
