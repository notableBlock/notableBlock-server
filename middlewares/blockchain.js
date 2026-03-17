const ethers = require("ethers");
const createError = require("http-errors");

const { findNoteById } = require("../services/noteServices");
const { getContract, getBlockchainData } = require("../services/ethersServices");

const { EMPTY_BYTES32 } = require("../utils/constants");

const TRANSACTION_TIMEOUT_MS = 30000;

const waitWithTimeout = (promise, ms, message) => {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
  return Promise.race([promise, timeout]);
};

const convertIdsToBlockchain = async (req, res, next) => {
  const { noteId } = req.params;
  const { creatorId } = await findNoteById(noteId);

  try {
    const blockchainContract = await getContract();
    const blockChainData = await getBlockchainData(blockchainContract, creatorId, noteId);
    const [creatorIdFromBlockchain, noteIdFromBlockchain] = blockChainData;

    if (creatorIdFromBlockchain === EMPTY_BYTES32 || noteIdFromBlockchain === EMPTY_BYTES32) {
      const transactionResponse = await blockchainContract.addNoteData(
        ethers.encodeBytes32String(creatorId.toString()),
        ethers.encodeBytes32String(noteId)
      );
      await waitWithTimeout(
        transactionResponse.wait(),
        TRANSACTION_TIMEOUT_MS,
        "블록체인 트랜잭션 확인 시간이 초과되었어요."
      );

      const blockchainIds = await getBlockchainData(blockchainContract, creatorId, noteId);
      req.blockchainData = blockchainIds;
    } else {
      req.blockchainData = blockChainData;
    }

    next();
  } catch (err) {
    console.log(err);
    next(createError(500, "ID를 블록체인 데이터로 변환하던 중 오류가 발생했어요."));
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

        if (creatorIdFromBlockchain === EMPTY_BYTES32 || noteIdFromBlockchain === EMPTY_BYTES32) {
          const transactionResponse = await blockchainContract.addNoteData(
            ethers.encodeBytes32String(decodedCreatorId),
            ethers.encodeBytes32String(decodedNoteId)
          );

          await waitWithTimeout(
            transactionResponse.wait(),
            TRANSACTION_TIMEOUT_MS,
            "블록체인 트랜잭션 확인 시간이 초과되었어요."
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
    console.log(err);
    next(createError(500, "블록체인 데이터를 ID로 변환하던중 오류가 발생했어요."));
  }
};

module.exports = { convertIdsToBlockchain, decodeBytesIdsToBlockchainIds };
