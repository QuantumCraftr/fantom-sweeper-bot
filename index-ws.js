const { Web3 } = require('web3');
require('dotenv').config();

// Configuration
const NETWORK = process.env.NETWORK || 'fantom';
const WS_URL = process.env.WS_RPC_URL || 'wss://wsapi.fantom.network';
const OLD_WALLET_ADDRESS = process.env.OLD_WALLET_ADDRESS;
const NEW_WALLET_ADDRESS = process.env.NEW_WALLET_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const GAS_LIMIT = 21000;
const MAX_PRIORITY_FEE = Web3.utils.toWei('100', 'gwei');
const MIN_BALANCE_TO_KEEP = Web3.utils.toWei('0.01', 'ether');

// Initialize Web3 with WebSocket provider
const web3 = new Web3(new Web3.providers.WebsocketProvider(WS_URL));

// Function to handle websocket connection errors
const setupWebsocketProvider = () => {
    const provider = new Web3.providers.WebsocketProvider(WS_URL);
    
    provider.on('error', e => console.error('WS Error', e));
    provider.on('end', e => {
        console.log('WS closed');
        console.log('Attempting to reconnect...');
        setupWebsocketProvider();
    });

    web3.setProvider(provider);
};

// Function to create and sign a transaction
async function createAndSignTransaction(value, maxPriorityFeePerGas, maxFeePerGas) {
    const nonce = await web3.eth.getTransactionCount(OLD_WALLET_ADDRESS, 'pending');
    const txObject = {
        from: OLD_WALLET_ADDRESS,
        nonce: web3.utils.toHex(nonce),
        to: NEW_WALLET_ADDRESS,
        value: web3.utils.toHex(value),
        gas: web3.utils.toHex(GAS_LIMIT),
        maxPriorityFeePerGas: web3.utils.toHex(maxPriorityFeePerGas),
        maxFeePerGas: web3.utils.toHex(maxFeePerGas)
    };
    return web3.eth.accounts.signTransaction(txObject, PRIVATE_KEY);
}

// Function to transfer funds
async function transferFunds() {
    try {
        const balance = BigInt(await web3.eth.getBalance(OLD_WALLET_ADDRESS));
        console.log(`Current balance: ${web3.utils.fromWei(balance.toString(), 'ether')} FTM`);

        if (balance <= BigInt(MIN_BALANCE_TO_KEEP)) {
            console.log('Balance too low for transfer');
            return;
        }

        const gasPrice = BigInt(await web3.eth.getGasPrice());
        const maxFeePerGas = gasPrice + BigInt(MAX_PRIORITY_FEE);
        const estimatedGasCost = BigInt(GAS_LIMIT) * maxFeePerGas;
        const valueToSend = balance - estimatedGasCost - BigInt(MIN_BALANCE_TO_KEEP);

        if (valueToSend <= 0n) {
            console.log('Insufficient balance to transfer after keeping minimum balance');
            return;
        }

        const tx = await createAndSignTransaction(valueToSend, MAX_PRIORITY_FEE, maxFeePerGas);
        const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
        console.log(`Transaction sent: ${receipt.transactionHash}`);
    } catch (error) {
        console.error(`Transfer error: ${error.message}`);
    }
}

// Function to monitor pending transactions
async function monitorPendingTransactions() {
    const subscription = await web3.eth.subscribe('pendingTransactions');

    subscription.on('data', async (txHash) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const tx = await web3.eth.getTransaction(txHash);
            if (tx && tx.to && tx.to.toLowerCase() === OLD_WALLET_ADDRESS.toLowerCase()) {
                console.log(`Incoming transaction detected for your address: ${txHash}`);
                await transferFunds();
            } else if (tx) {
                console.log(`Transaction ${txHash} not related to your address, ignoring.`);
            } else {
                console.log(`Transaction ${txHash} not found, may have been processed quickly.`);
            }
        } catch (error) {
            console.error(`Error processing transaction ${txHash}: ${error.message}`);
        }
    });

    subscription.on('error', (error) => {
        console.error(`Subscription error: ${error.message}`);
    });
}

// Main function
async function main() {
    setupWebsocketProvider();
    console.log('Starting to monitor pending transactions...');
    await monitorPendingTransactions();
}

// Start the script
main().catch((error) => {
    console.error(`Main function error: ${error.message}`);
    process.exit(1);
});