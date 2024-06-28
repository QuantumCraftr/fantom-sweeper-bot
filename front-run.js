const { Web3 } = require('web3');
require('dotenv').config();

// Configuration
const network = process.env.NETWORK || process.argv[2] || "mainnet";
const rpcUrl = getEnvValue('RPC_URL', 'RPC_URL_TESTNET');
const oldWalletAddress = getEnvValue('OLD_WALLET_ADDRESS', 'OLD_WALLET_ADDRESS_TESTNET')?.toLowerCase();
const newWalletAddress = getEnvValue('NEW_WALLET_ADDRESS', 'NEW_WALLET_ADDRESS_TESTNET')?.toLowerCase();
const privateKey = getEnvValue('PRIVATE_KEY', 'PRIVATE_KEY_TESTNET');

const web3 = new Web3(rpcUrl);

const GAS_LIMIT = BigInt(21000);
const MAX_PRIORITY_FEE = BigInt(web3.utils.toWei('100', 'gwei')); // Very high priority fee
const POLLING_INTERVAL = 1000; // 1 second

let lastCheckedBlock = 0;

function getEnvValue(key, testnetKey) {
    return network === "testnet" ? process.env[testnetKey] : process.env[key];
}

async function checkNewTransactions() {
    try {
        const latestBlock = await web3.eth.getBlockNumber();
        
        if (latestBlock > lastCheckedBlock) {
            console.log(`Checking blocks from ${lastCheckedBlock + 1} to ${latestBlock}`);
            for (let i = lastCheckedBlock + 1; i <= latestBlock; i++) {
                const block = await web3.eth.getBlock(i, false);
                if (block && block.transactions) {
                    for (const txHash of block.transactions) {
                        const tx = await web3.eth.getTransaction(txHash);
                        if (tx && tx.to && tx.to.toLowerCase() === oldWalletAddress) {
                            console.log(`Detected incoming transaction to compromised wallet in block ${i}: ${tx.hash}`);
                            await reactToTransaction(tx);
                        }
                    }
                }
            }
            lastCheckedBlock = latestBlock;
        }
    } catch (error) {
        console.error('Error checking new transactions:', error);
    }
    
    setTimeout(checkNewTransactions, POLLING_INTERVAL);
}

async function reactToTransaction(competingTx) {
    try {
        const balance = BigInt(await web3.eth.getBalance(oldWalletAddress));
        if (balance <= BigInt(0)) {
            console.log('No balance to transfer.');
            return;
        }

        const gasPrice = BigInt(await web3.eth.getGasPrice());
        const maxFeePerGas = gasPrice + MAX_PRIORITY_FEE;
        const estimatedGasCost = GAS_LIMIT * maxFeePerGas;
        const valueToSend = balance > estimatedGasCost ? balance - estimatedGasCost : balance * BigInt(95) / BigInt(100);

        const tx = await createAndSignTransaction(valueToSend, MAX_PRIORITY_FEE, maxFeePerGas);
        const txReceipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
        console.log(`Emergency transfer sent with hash: ${txReceipt.transactionHash}`);
    } catch (error) {
        console.error(`Error reacting to transaction:`, error);
    }
}

async function createAndSignTransaction(value, maxPriorityFeePerGas, maxFeePerGas) {
    const nonce = await web3.eth.getTransactionCount(oldWalletAddress, 'pending');
    const txObject = {
        from: oldWalletAddress,
        nonce: nonce,
        to: newWalletAddress,
        value: value.toString(),
        gas: GAS_LIMIT.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        maxFeePerGas: maxFeePerGas.toString()
    };
    return web3.eth.accounts.signTransaction(txObject, privateKey);
}

console.log(`Script started in ${network} mode`);
checkNewTransactions();