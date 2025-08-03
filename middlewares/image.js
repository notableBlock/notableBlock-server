const createError = require("http-errors");
const path = require("path");

const { putS3Object } = require("../services/s3Services");

const saveImageFromTar = async (req, res, next) => {
  const { imageFilePaths, s3UploadTargets, tempDirectory } = req;
  const imageFileNames = imageFilePaths.map((filepath) => path.basename(filepath));

  try {
    await Promise.all(
      imageFilePaths.map(async (filepath) => {
        for (const { s3Key, originalFilename } of s3UploadTargets) {
          const isNotUsedImage = !imageFileNames.includes(originalFilename);
          if (isNotUsedImage) return;

          const fullPath = path.join(tempDirectory, filepath);
          return await putS3Object(s3Key, fullPath);
        }
      })
    );

    next();
  } catch (err) {
    next(createError(500, "파일에 있던 이미지를 저장하던 중 오류가 발생했어요."));
  }
};

module.exports = saveImageFromTar;
