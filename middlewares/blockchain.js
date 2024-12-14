const ethers = require("ethers");
const createError = require("http-errors");

const findNoteById = require("../services/findNoteById");
const { getContract, getBlockchainData } = require("../services/ethersServices");
const { NO_BLOCKCHAIN_DATA } = require("../utils/constants");

const convertIdToBlockchain = async (req, res, next) => {
  const { noteId } = req.params;
  const { creatorId } = await findNoteById(noteId);

  try {
    const contract = await getContract();
    const blockChainData = await getBlockchainData(contract, creatorId, noteId);
    const [creatorIdFromBlockchain, noteIdFromBlockchain] = blockChainData;

    if (
      creatorIdFromBlockchain === NO_BLOCKCHAIN_DATA ||
      noteIdFromBlockchain === NO_BLOCKCHAIN_DATA
    ) {
      await contract.addNoteData(
        ethers.encodeBytes32String(creatorId.toString()),
        ethers.encodeBytes32String(noteId)
      );

      const idFromBlockchain = await getBlockchainData(contract, creatorId, noteId);
      req.blockchainData = idFromBlockchain;
    } else {
      req.blockchainData = blockChainData;
    }

    next();
  } catch (err) {
    next(createError(500, "ID를 블록체인 데이터로 변환하는데 실패했습니다."));
    return;
  }
};

const convertBlockchainToId = async (req, res, next) => {
  const { creatorIdByBytes, noteIdByBytes } = req.bytesId;

  if (!creatorIdByBytes || !noteIdByBytes) {
    next();
    return;
  }

  try {
    const bytesId = [creatorIdByBytes, noteIdByBytes];
    const parseId = bytesId.map((id) => ethers.decodeBytes32String(id));
    const [decodedCreatorId, decodedNoteId] = parseId;

    const contract = await getContract();
    const blockchainData = await getBlockchainData(contract, decodedCreatorId, decodedNoteId);
    const [creatorIdFromBlockchain, noteIdFromBlockchain] = blockchainData;

    if (
      creatorIdFromBlockchain === NO_BLOCKCHAIN_DATA ||
      noteIdFromBlockchain === NO_BLOCKCHAIN_DATA
    ) {
      await contract.addNoteData(
        ethers.encodeBytes32String(decodedCreatorId),
        ethers.encodeBytes32String(decodedNoteId)
      );
    }

    req.idFromBlockchain = { decodedCreatorId, decodedNoteId };

    next();
  } catch (err) {
    next(createError(500, "블록체인 데이터를 ID로 변환하는데 실패했습니다."));
    return;
  }
};

module.exports = { convertIdToBlockchain, convertBlockchainToId };
