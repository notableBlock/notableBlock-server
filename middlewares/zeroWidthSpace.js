const fs = require("fs");
const createError = require("http-errors");

const {
  idToBinary,
  binaryToZeroWidth,
  zeroWidthToBinary,
  binaryToId,
} = require("../utils/convertZeroWidth");

const convertIdToZeroWidth = (req, res, next) => {
  const [creatorId, noteId] = req.blockchainData;

  const binaryCreatorId = idToBinary(creatorId);
  const binaryNoteId = idToBinary(noteId);

  const zwcCreatorId = binaryToZeroWidth(binaryCreatorId);
  const zwcNoteId = binaryToZeroWidth(binaryNoteId);

  req.zwcId = { zwcCreatorId, zwcNoteId };
  next();
};

const convertZeroWidthToId = (req, res, next) => {
  const filePath = req.file.path;

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      next(createError(500, "파일을 읽는데 실패했습니다."));
      return;
    }

    const decoded = zeroWidthToBinary(data);
    const result = binaryToId(decoded.trim());

    const creatorIdByBytes = result.slice(0, 66);
    const noteIdByBytes = result.slice(66);

    req.bytesId = { creatorIdByBytes, noteIdByBytes };
    next();
  });
};

module.exports = { convertIdToZeroWidth, convertZeroWidthToId };
