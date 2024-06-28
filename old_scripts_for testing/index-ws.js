const Web3 = require('web3');
require('dotenv').config();

const wsRpcUrl = process.env.WS_RPC_URL;
const web3 = new Web3(new Web3.providers.WebsocketProvider(wsRpcUrl));

const oldWalletAddress = process.env.OLD_WALLET_ADDRESS.toLowerCase(); // Convertir en minuscules
const newWalletAddress = process.env.NEW_WALLET_ADDRESS.toLowerCase(); // Convertir en minuscules
const privateKey = process.env.PRIVATE_KEY;

const checkAndTransfer = async () => {
  try {
    const balance = await web3.eth.getBalance(oldWalletAddress);
    if (balance > 0) {
      const nonce = await web3.eth.getTransactionCount(oldWalletAddress, 'pending');
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

      const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
      const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log(`Transaction envoyée avec le hash: ${txReceipt.transactionHash}`);
    } else {
      console.log('Pas de fonds à transférer.');
    }
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
  }
};

web3.eth.subscribe('pendingTransactions', async (error, txHash) => {
  if (error) {
    console.error(`Erreur lors de la souscription aux transactions en attente: ${error}`);
  } else {
    try {
      const tx = await web3.eth.getTransaction(txHash);
      if (tx && tx.to && tx.to.toLowerCase() === oldWalletAddress) {
        console.log(`Transaction détectée vers ${oldWalletAddress}: ${txHash}`);
        await checkAndTransfer();
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification de la transaction: ${error}`);
    }
  }
});

console.log('Monitoring des transactions en attente...');