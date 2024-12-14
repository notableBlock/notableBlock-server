const ethers = require("ethers");

const contractABI = require("../resources/contractABI");
const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

const getContract = async () => {
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_PROVIDER);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  return contract;
};

const getBlockchainData = async (contract, creatorId, noteId) => {
  return await contract.getNoteData(
    ethers.encodeBytes32String(creatorId.toString()),
    ethers.encodeBytes32String(noteId)
  );
};

module.exports = { getContract, getBlockchainData };
