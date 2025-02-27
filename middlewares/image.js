const fs = require("fs");
const path = require("path");
const createError = require("http-errors");

const saveImageFromTar = async (req, res, next) => {
  const { imageFiles, tempDirectory, mdFilesBlocks } = req;

  const blocksImageName = mdFilesBlocks
    .filter(({ tag }) => tag === "img")
    .map(({ imageUrl }) => path.basename(imageUrl));

  try {
    const saveImagePromises = imageFiles.map(async (file) => {
      const imageFilePath = path.join(tempDirectory, file);
      const imageSavePath = path.join(
        __dirname,
        "..",
        "public",
        "uploads",
        "images",
        path.basename(file)
      );

      try {
        const isUsedImage = await new Promise((resolve, reject) => {
          const imageFileName = path.basename(imageFilePath);

          if (blocksImageName.includes(imageFileName)) {
            return resolve(true);
          }

          return reject(new Error(`${imageFileName}는 마크다운에서 사용되지 않는 이미지입니다.`));
        });

        if (!isUsedImage) return null;

        return new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(imageFilePath);
          const writeStream = fs.createWriteStream(imageSavePath);

          readStream.pipe(writeStream);

          writeStream.on("finish", () => {
            console.log(`${file} 저장 완료`);
            resolve(imageSavePath);
          });

          writeStream.on("error", (err) => {
            console.log(`${file} 저장 실패:`, err);
            reject(err);
          });
        });
      } catch (err) {
        console.log("이미지 저장 중 오류 발생:", err);
        return null;
      }
    });

    await Promise.all(saveImagePromises);
    next();
  } catch (err) {
    next(createError(500, "파일에 있던 이미지를 저장하던 중 오류가 발생했습니다."));
  }
};

module.exports = saveImageFromTar;
