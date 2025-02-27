const fs = require("fs");
const path = require("path");
const createError = require("http-errors");

const saveImageFromTar = async (req, res, next) => {
  const { imageFiles, tempDirectory } = req;

  try {
    const saveImagePromises = () => {
      return imageFiles.map(async (file) => {
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
          const readStream = fs.createReadStream(imageFilePath);
          const writeStream = fs.createWriteStream(imageSavePath);

          return await new Promise((resolve, reject) => {
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
          console.log("이미지 저장 실패 = ", err);

          return null;
        }
      });
    };

    try {
      await Promise.all(saveImagePromises());
    } catch (err) {
      return next(createError(500, "일부 이미지 저장에 실패했습니다."));
    }

    next();
  } catch (err) {
    next(createError(500, "파일에 있던 이미지를 저장하던 중 오류가 발생했습니다."));
  }
};

module.exports = saveImageFromTar;
