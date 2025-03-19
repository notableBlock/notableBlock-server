const fs = require("fs");
const path = require("path");
const createError = require("http-errors");

const saveImageFromTar = async (req, res, next) => {
  const { imageFiles, tempDirectory, mdFilesBlocks } = req;

  const usedImageNames = mdFilesBlocks.flatMap((blocks) =>
    blocks.filter(({ tag }) => tag === "img").map(({ imageUrl }) => path.basename(imageUrl))
  );

  try {
    const saveImagePromises = imageFiles
      .filter((imageFile) => usedImageNames.includes(imageFile))
      .map((imageFile) => {
        const imageFilePath = path.join(tempDirectory, imageFile);
        const imageSavePath = path.join(__dirname, "..", "public", "uploads", "images", imageFile);

        return new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(imageFilePath);
          const writeStream = fs.createWriteStream(imageSavePath);

          readStream.pipe(writeStream);

          writeStream.on("finish", () => {
            console.log(`${imageFile} 저장 완료`);
            resolve(imageSavePath);
          });

          writeStream.on("error", (err) => {
            console.log(`${imageFile} 저장 실패:`, err);
            reject(err);
          });
        });
      });

    await Promise.all(saveImagePromises);

    next();
  } catch (err) {
    next(createError(500, "파일에 있던 이미지를 저장하던 중 오류가 발생했어요."));
  }
};

module.exports = saveImageFromTar;
