const ethers = require("ethers");

const contractABI = require("../resources/contractABI");
const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

const getContract = async () => {
  const fetchRequest = new ethers.FetchRequest(process.env.BLOCKCHAIN_PROVIDER.trim());
  fetchRequest.timeout = 10000;

  const provider = new ethers.JsonRpcProvider(fetchRequest, undefined, {
    staticNetwork: true,
  });

  const signer =
    process.env.NODE_ENV === "production"
      ? new ethers.Wallet(process.env.PRIVATE_KEY, provider)
      : await provider.getSigner();

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
