const createError = require("http-errors");

const { convertToZwcId, convertToBytesId } = require("../utils/convertZwc");

const convertIdsToZwcIds = (req, res, next) => {
  const [creatorId, noteId] = req.blockchainData;

  const zwcCreatorId = convertToZwcId(creatorId);
  const zwcNoteId = convertToZwcId(noteId);

  req.zwcIds = { zwcCreatorId, zwcNoteId };
  next();
};

const convertZwcIdsToBytesIds = async (req, res, next) => {
  const { extractedIds } = req;

  try {
    const bytesIds = await Promise.all(
      extractedIds.map(({ extractedCreatorId, extractedNoteId }) => ({
        creatorIdByBytes: convertToBytesId(extractedCreatorId),
        noteIdByBytes: convertToBytesId(extractedNoteId),
      }))
    );

    req.bytesIds = bytesIds;
    next();
  } catch (err) {
    next(createError(500, "ZWC ID 변환 중 오류가 발생했습니다."));
  }
};

module.exports = { convertIdsToZwcIds, convertZwcIdsToBytesIds };
