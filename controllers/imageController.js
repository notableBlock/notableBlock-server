const createError = require("http-errors");

const clearImage = require("../services/uploadsServices");

const uploadImageToNote = async (req, res, next) => {
  const imageUrl = `/uploads/images/${req.file.filename}`;

  try {
    res.status(200).json({
      message: "이미지를 첨부하는데 성공했습니다.",
      imageUrl: imageUrl,
    });
  } catch (err) {
    next(createError(500, "이미지를 첨부하는데 실패했습니다."));
  }
};

const removeImageFromNote = async (req, res, next) => {
  const { imageName } = req.params;

  if (!imageName) {
    return next(createError(404, "이미지를 찾을 수 없습니다."));
  }

  try {
    const imagePath = `images/${imageName}`;
    clearImage(imagePath);

    res.status(200).json({ message: "이미지가 정상적으로 삭제되었습니다." });
  } catch (err) {
    next(createError(500, "이미지를 삭제하는데 실패했습니다."));
  }
};

module.exports = { uploadImageToNote, removeImageFromNote };
