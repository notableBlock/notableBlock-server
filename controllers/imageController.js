const createError = require("http-errors");

const clearImage = require("../services/cleanUpServices");

const uploadImageToNote = async (req, res, next) => {
  const { key } = req.file;
  const imageUrl = `${process.env.ASSETS_URL}/${key}`;

  try {
    res.status(200).json({
      message: "이미지를 첨부하는데 성공했어요.",
      imageUrl,
    });
  } catch (err) {
    console.log(err);
    next(createError(500, "이미지를 첨부하는데 실패했어요."));
  }
};

const removeImageFromNote = async (req, res, next) => {
  const { imageName } = req.params;

  if (!imageName) {
    return next(createError(404, "이미지를 찾을 수 없어요."));
  }

  try {
    clearImage(imageName);

    res.status(200).json({ message: "이미지가 정상적으로 삭제되었어요." });
  } catch (err) {
    console.log(err);
    next(createError(500, "이미지를 삭제하는데 실패했어요."));
  }
};

module.exports = { uploadImageToNote, removeImageFromNote };
