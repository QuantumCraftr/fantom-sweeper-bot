const { Web3 } = require('web3');
require('dotenv').config();

// Configuration
const network = process.env.NETWORK || process.argv[2] || "mainnet";

// Function to get an environment value with a default value
function getEnvValue(key, testnetKey) {
    return network === "testnet" ? process.env[testnetKey] : process.env[key];
}

// Check for required environment variables
const requiredEnvVars = [
    'WS_RPC_URL', 'WS_RPC_TESTNET',
    'OLD_WALLET_ADDRESS', 'OLD_WALLET_ADDRESS_TESTNET',
    'NEW_WALLET_ADDRESS', 'NEW_WALLET_ADDRESS_TESTNET',
    'PRIVATE_KEY', 'PRIVATE_KEY_TESTNET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const wsRpcUrl = getEnvValue('WS_RPC_URL', 'WS_RPC_TESTNET');
const oldWalletAddress = getEnvValue('OLD_WALLET_ADDRESS', 'OLD_WALLET_ADDRESS_TESTNET')?.toLowerCase();
const newWalletAddress = getEnvValue('NEW_WALLET_ADDRESS', 'NEW_WALLET_ADDRESS_TESTNET')?.toLowerCase();
const privateKey = getEnvValue('PRIVATE_KEY', 'PRIVATE_KEY_TESTNET');

if (!oldWalletAddress || !newWalletAddress || !privateKey) {
    console.error('Missing critical wallet information. Please check your .env file.');
    process.exit(1);
}

console.log(`Network: ${network}`);
console.log(`WebSocket RPC URL: ${wsRpcUrl}`);
console.log(`Old Wallet Address: ${oldWalletAddress}`);
console.log(`New Wallet Address: ${newWalletAddress}`);

const web3 = new Web3(wsRpcUrl);
const MIN_BALANCE_TO_TRANSFER = BigInt(web3.utils.toWei('0.001', 'ether'));
const GAS_LIMIT = BigInt(21000);

async function checkAndTransfer() {
    try {
        const balance = BigInt(await web3.eth.getBalance(oldWalletAddress));
        console.log(`Balance of ${oldWalletAddress}: ${web3.utils.fromWei(balance.toString(), 'ether')} FTM`);
        
        if (balance <= MIN_BALANCE_TO_TRANSFER) {
            console.log('Insufficient funds for transfer.');
            return;
        }

        const gasPrice = BigInt(await web3.eth.getGasPrice());
        const maxPriorityFeePerGas = BigInt(web3.utils.toWei('5', 'gwei')); // Increased to 5 gwei
        const maxFeePerGas = gasPrice + maxPriorityFeePerGas;
        const estimatedGasCost = GAS_LIMIT * maxFeePerGas;
        const valueToSend = balance - estimatedGasCost;

        if (valueToSend <= 0n) {
            console.log('Insufficient balance to cover gas costs.');
            return;
        }

        const tx = await createAndSignTransaction(valueToSend, maxPriorityFeePerGas, maxFeePerGas);
        const txReceipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
        console.log(`Transaction sent with hash: ${txReceipt.transactionHash}`);
        process.exit(0); // Exit after successful transfer
    } catch (error) {
        console.error(`Error: ${error.message}`);
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

// Setup WebSocket subscription
let isConnected = false;

const subscription = web3.eth.subscribe('newBlockHeaders', (error, blockHeader) => {
    if (error) {
        console.error(`WebSocket error: ${error.message}`);
        return;
    }
    if (!isConnected) {
        console.log('WebSocket connected. Waiting for new blocks...');
        isConnected = true;
    }
    console.log(`New block received. Block number: ${blockHeader.number}`);
    checkAndTransfer();
}).on('error', (error) => {
    console.error(`WebSocket subscription error: ${error.message}`);
});
// subscription.on('connected', () => {
//     console.log('WebSocket connected. Waiting for new blocks...');
// });

// subscription.on('error', (error) => {
//     console.error(`WebSocket subscription error: ${error.message}`);
// });


process.on('SIGINT', async () => {
    try {
        await subscription.unsubscribe();
        console.log('WebSocket unsubscribed successfully.');
    } catch (error) {
        console.error('Error unsubscribing:', error);
    }
    process.exit(0);
});
// Handle script termination
// process.on('SIGINT', () => {
//     subscription.unsubscribe((error, success) => {
//         if (success) {
//             console.log('WebSocket unsubscribed successfully.');
//         }
//         process.exit(0);
//     });
// });