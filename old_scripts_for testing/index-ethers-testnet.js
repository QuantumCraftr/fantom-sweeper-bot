const { ethers } = require("ethers");
require("dotenv").config();

const network = process.env.NETWORK || "mainnet"; // Utilisez 'testnet' pour le testnet
const wsRpcUrl = network === "testnet" ? process.env.WS_RPC_TESTNET : process.env.WS_RPC_URL;

const provider = new ethers.WebSocketProvider(wsRpcUrl);

const oldWalletAddress = process.env.OLD_WALLET_ADDRESS_TESTNET.toLowerCase();
const newWalletAddress = process.env.NEW_WALLET_ADDRESS_TESTNET.toLowerCase();
const privateKey = process.env.PRIVATE_KEY_TESTNET;

const wallet = new ethers.Wallet(privateKey, provider);

const checkAndTransfer = async () => {
    try {
        const balance = await provider.getBalance(oldWalletAddress);
        if (balance.gt(ethers.utils.parseEther("0"))) {
            const nonce = await provider.getTransactionCount(oldWalletAddress, "pending");
            const gasPrice = await provider.getGasPrice();
            const maxPriorityFeePerGas = ethers.utils.parseUnits("3", "gwei");
            const maxFeePerGas = gasPrice.mul(2); // Payer jusqu'à 2 fois le prix du gas

            const tx = {
                nonce: nonce,
                to: newWalletAddress,
                value: balance.sub(ethers.utils.parseUnits("0.001", "ether")), // Laisser un peu pour les frais
                gasLimit: 21000, // Valeur par défaut pour une simple transaction
                maxPriorityFeePerGas: maxPriorityFeePerGas,
                maxFeePerGas: maxFeePerGas,
            };

            const transactionResponse = await wallet.sendTransaction(tx);
            const receipt = await transactionResponse.wait();
            console.log(`Transaction envoyée avec le hash: ${receipt.transactionHash}`);
        } else {
            console.log("Pas de fonds à transférer.");
        }
    } catch (error) {
        console.error(`Erreur: ${error.message}`);
    }
};

provider.on("pending", async (txHash) => {
    try {
        const tx = await provider.getTransaction(txHash);
        if (tx && tx.to && tx.to.toLowerCase() === oldWalletAddress) {
            console.log(`Transaction détectée vers ${oldWalletAddress}: ${txHash}`);
            await checkAndTransfer();
        }
    } catch (error) {
        console.error(`Erreur lors de la vérification de la transaction: ${error}`);
    }
});

console.log("Monitoring des transactions en attente...");
