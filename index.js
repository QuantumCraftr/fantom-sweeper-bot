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
    'RPC_URL', 'RPC_URL_TESTNET',
    'OLD_WALLET_ADDRESS', 'OLD_WALLET_ADDRESS_TESTNET',
    'NEW_WALLET_ADDRESS', 'NEW_WALLET_ADDRESS_TESTNET',
    'PRIVATE_KEY', 'PRIVATE_KEY_TESTNET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const rpcUrl = getEnvValue('RPC_URL', 'RPC_URL_TESTNET');
const oldWalletAddress = getEnvValue('OLD_WALLET_ADDRESS', 'OLD_WALLET_ADDRESS_TESTNET')?.toLowerCase();
const newWalletAddress = getEnvValue('NEW_WALLET_ADDRESS', 'NEW_WALLET_ADDRESS_TESTNET')?.toLowerCase();
const privateKey = getEnvValue('PRIVATE_KEY', 'PRIVATE_KEY_TESTNET');

console.log(`Network: ${network}`);
console.log(`Old Wallet Address: ${oldWalletAddress}`);
console.log(`New Wallet Address: ${newWalletAddress}`);

if (!oldWalletAddress || !newWalletAddress || !privateKey) {
    console.error('Missing critical wallet information. Please check your .env file.');
    process.exit(1);
}

const web3 = new Web3(rpcUrl);
const MIN_BALANCE_TO_TRANSFER = BigInt(web3.utils.toWei('0.001', 'ether'));
const CHECK_INTERVAL = 500; // 0.5 second (aggressive)
const GAS_LIMIT = BigInt(21000);

// Main function
async function checkAndTransfer() {
    try {
        const balance = BigInt(await web3.eth.getBalance(oldWalletAddress));
        console.log(`Balance of ${oldWalletAddress}: ${web3.utils.fromWei(balance.toString(), 'ether')} FTM`);
        
        if (balance <= MIN_BALANCE_TO_TRANSFER) {
            console.log('Insufficient funds for transfer.');
            return;
        }

        const gasPrice = BigInt(await web3.eth.getGasPrice());
        const maxPriorityFeePerGas = BigInt(web3.utils.toWei('5', 'gwei')); // 5 to maximise chances but can be 3 if you consider it enough
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
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// Helper function to create and sign the transaction
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

// Function to run continuously
function runContinuously() {
    checkAndTransfer().then(() => {
        setTimeout(runContinuously, CHECK_INTERVAL);
    }).catch((error) => {
        console.error(`Unexpected error: ${error.message}`);
        setTimeout(runContinuously, CHECK_INTERVAL);
    });
}

console.log(`Script started in ${network} mode`);
runContinuously();