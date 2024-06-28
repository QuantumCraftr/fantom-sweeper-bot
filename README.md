

# Fantom Sweeper Recovery Bot

The Fantom Sweeper Recovery Bot is a Node.js script designed to quickly recover funds from a compromised wallet on the Fantom Opera blockchain. It continuously monitors a specified wallet address and automatically transfers any incoming funds to a secure wallet address as soon as they are detected.

>>Intended as education purpose only, to try to recover funds that are watched by a sweeper bot

## Features

- Monitors a specified wallet address on the Fantom Opera blockchain
- Automatically transfers funds to a secure wallet address
- Supports both mainnet and testnet
- Configurable minimum balance threshold for transfers
- Continuous operation with error handling and automatic retries

## Prerequisites

- Node.js (v18 in this example or higher)
- npm (Node Package Manager)

## Installation

1. Clone this repository or download the source code.
2. Navigate to the project directory in your terminal.
3. Install the required dependencies:
4. `npm install`
5. Create a `.env` file in the project root directory with the following content:
6. ```RPC_URL_MAINNET=<Your Fantom Opera mainnet RPC URL>
```RPC_URL_TESTNET=<Your Fantom Opera testnet RPC URL>
OLD_WALLET_ADDRESS_MAINNET=<Compromised wallet address for mainnet>
OLD_WALLET_ADDRESS_TESTNET=<Compromised wallet address for testnet>
NEW_WALLET_ADDRESS_MAINNET=<Secure wallet address for mainnet>
NEW_WALLET_ADDRESS_TESTNET=<Secure wallet address for testnet>
PRIVATE_KEY_MAINNET=<Private key of the compromised wallet for mainnet>
PRIVATE_KEY_TESTNET=<Private key of the compromised wallet for testnet>
```
7. Replace the placeholders with your actual values.

## Usage

To run the bot, use one of the following commands:

For mainnet:
`NETWORK=mainnet node index.js`

For testnet:
`NETWORK=testnet node index.js`

Copy
Alternatively, you can use command-line arguments:

For mainnet:
`node index.js mainnet`

For testnet:
`node index.js testnet`

The bot will start monitoring the specified wallet and log its activities to the console.

## Warning

This bot handles private keys and transfers funds automatically. Use it with caution and ensure that you're running it in a secure environment. Never share your private keys or expose them in any way.

## License

[MIT License](LICENSE)

## Support

For issues, questions, or contributions, please open an issue in the GitHub repository.


## Bonus

If you need some FTM for testnet, you can use this faucet: https://faucet.fantom.network/

## Fantom Foundation RPC Links

https://docs.fantom.foundation/api/public-api-endpoints