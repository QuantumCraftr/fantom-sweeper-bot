const { ethers } = require("ethers");
require("dotenv").config();

const network = process.env.NETWORK || "mainnet";
const rpcUrl = network === "testnet" ? process.env.RPC_TESTNET_URL : process.env.RPC_URL;

const provider = new ethers.JsonRpcProvider(rpcUrl);
const walletAddress = process.env.WALLET_ADDRESS.toLowerCase();

const checkStakingStatus = async () => {
  try {
    // Exemple d'interaction avec un smart contract de staking
    const stakingContractAddress = process.env.CONTRACT_ABI_ADDRESS;
    const stakingContractAbi = [/* ABI du contrat de staking */];
    const stakingContract = new ethers.Contract(stakingContractAddress, stakingContractAbi, provider);

    // Supposons qu'il existe une fonction pour vérifier le statut de staking
    const stakingStatus = await stakingContract.getStakingStatus(walletAddress);
    console.log(`Statut de staking: ${stakingStatus}`);
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
  }
};

checkStakingStatus();
