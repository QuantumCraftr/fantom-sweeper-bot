const Web3 = require('web3');
require('dotenv').config();

const rpcUrl = process.env.RPC_URL;
// Correction de l'instanciation de Web3
const web3 = new Web3(rpcUrl);

const oldWalletAddress = process.env.OLD_WALLET_ADDRESS.toLowerCase(); // Convertir en minuscules
const newWalletAddress = process.env.NEW_WALLET_ADDRESS.toLowerCase(); // Convertir en minuscules
const privateKey = process.env.PRIVATE_KEY;

// Fonction pour estimer le gas nécessaire
const estimateGas = async (tx) => {
  try {
    return await web3.eth.estimateGas(tx);
  } catch (error) {
    console.error('Erreur lors de l\'estimation du gas:', error);
    throw error;
  }
};

const checkAndTransfer = async () => {
  try {
    const balance = await web3.eth.getBalance(oldWalletAddress);
    if (balance > 0) {
      const nonce = await web3.eth.getTransactionCount(oldWalletAddress, 'pending');
      // Augmenter le prix du gas pour une transaction prioritaire
      const gasPrice = await web3.eth.getGasPrice();
      const maxPriorityFeePerGas = web3.utils.toWei('3', 'gwei'); // Ajuster si nécessaire

      const tx = {
        from: oldWalletAddress,
        nonce: nonce,
        to: newWalletAddress,
        value: balance - web3.utils.toWei('0.001', 'ether'), // Laisser un peu pour les frais
        gas: 21000, // Valeur par défaut, à ajuster si nécessaire
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        maxFeePerGas: gasPrice * 2, // Payer jusqu'à 2 fois le prix du gas
      };

      // Estimer le gas nécessaire
      tx.gas = await estimateGas(tx);

      const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
      const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log(`Transaction envoyée avec le hash: ${txReceipt.transactionHash}`);
      process.exit(0); // Arrêter le script après le transfert
    } else {
      console.log('Pas de fonds à transférer.');
    }
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
    process.exit(1); // Arrêter le script en cas d'erreur
  }
};

checkAndTransfer();