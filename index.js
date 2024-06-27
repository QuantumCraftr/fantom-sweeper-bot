const { Web3 } = require('web3');
require('dotenv').config();

const rpcUrl = process.env.RPC_URL_TESTNET;
const web3 = new Web3(rpcUrl);

const oldWalletAddress = process.env.OLD_WALLET_ADDRESS_TESTNET.toLowerCase();
const newWalletAddress = process.env.NEW_WALLET_ADDRESS_TESTNET.toLowerCase();
const privateKey = process.env.PRIVATE_KEY_TESTNET;

const checkAndTransfer = async () => {
    try {
        const balance = BigInt(await web3.eth.getBalance(oldWalletAddress));
        console.log(`Balance of ${oldWalletAddress}: ${web3.utils.fromWei(balance.toString(), 'ether')} FTM`);
        
        if (balance > 0n) {
            const nonce = await web3.eth.getTransactionCount(oldWalletAddress, 'pending');
            const gasPrice = BigInt(await web3.eth.getGasPrice());
            const maxPriorityFeePerGas = BigInt(web3.utils.toWei('3', 'gwei'));
            const maxFeePerGas = gasPrice + maxPriorityFeePerGas;

            const valueToSend = balance - BigInt(web3.utils.toWei('0.001', 'ether'));
            const tx = {
                from: oldWalletAddress,
                nonce: nonce,
                to: newWalletAddress,
                value: valueToSend.toString(),
                gas: 21000,
                maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
                maxFeePerGas: maxFeePerGas.toString()
            };

            const gasEstimate = await web3.eth.estimateGas(tx);
            tx.gas = gasEstimate;

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