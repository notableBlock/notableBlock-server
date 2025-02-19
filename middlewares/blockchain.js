const ethers = require("ethers");
const createError = require("http-errors");

const findNoteById = require("../services/findNoteById");
const { getContract, getBlockchainData } = require("../services/ethersServices");

const { NO_BLOCKCHAIN_DATA } = require("../utils/constants");

const convertIdsToBlockchain = async (req, res, next) => {
  const { noteId } = req.params;
  const { creatorId } = await findNoteById(noteId);

  try {
    const blockchainContract = await getContract();
    const blockChainData = await getBlockchainData(blockchainContract, creatorId, noteId);
    const [creatorIdFromBlockchain, noteIdFromBlockchain] = blockChainData;

    if (
      creatorIdFromBlockchain === NO_BLOCKCHAIN_DATA ||
      noteIdFromBlockchain === NO_BLOCKCHAIN_DATA
    ) {
      await blockchainContract.addNoteData(
        ethers.encodeBytes32String(creatorId.toString()),
        ethers.encodeBytes32String(noteId)
      );

      const blockchainIds = await getBlockchainData(blockchainContract, creatorId, noteId);
      req.blockchainData = blockchainIds;
    } else {
      req.blockchainData = blockChainData;
    }

    next();
  } catch (err) {
    console.log(`ID 변환 실패: ${err.message}`);
    return next(createError(500, "ID를 블록체인 데이터로 변환하던 중 오류가 발생했습니다."));
  }
};

const decodeBytesIdsToBlockchainIds = async (req, res, next) => {
  const { bytesIds } = req;

  try {
    const blockchainContract = await getContract();

    const blockchainIds = await Promise.all(
      bytesIds.map(async ({ creatorIdByBytes, noteIdByBytes }) => {
        const [decodedCreatorId, decodedNoteId] = [
          ethers.decodeBytes32String(creatorIdByBytes),
          ethers.decodeBytes32String(noteIdByBytes),
        ];

        const [creatorIdFromBlockchain, noteIdFromBlockchain] = await getBlockchainData(
          blockchainContract,
          decodedCreatorId,
          decodedNoteId
        );

        if (
          creatorIdFromBlockchain === NO_BLOCKCHAIN_DATA ||
          noteIdFromBlockchain === NO_BLOCKCHAIN_DATA
        ) {
          await blockchainContract.addNoteData(
            ethers.encodeBytes32String(decodedCreatorId),
            ethers.encodeBytes32String(decodedNoteId)
          );
        }

        return {
          decodedCreatorId,
          decodedNoteId,
        };
      })
    );

    req.blockchainIds = blockchainIds;
    next();
  } catch (err) {
    console.log(`블록체인 데이터 변환 실패: ${err.message}`);
    return next(createError(500, "블록체인 데이터를 ID로 변환하던중 오류가 발생했습니다."));
  }
};

module.exports = { convertIdsToBlockchain, decodeBytesIdsToBlockchainIds };
