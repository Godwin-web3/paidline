export const SEPOLIA_CHAIN_KEY = 1;
export const SEPOLIA_CHAIN_ID = 11155111;
export const CREDITCOIN_TESTNET_CHAIN_ID = 102031;
export const BLOCK_PROVER = "0x0000000000000000000000000000000000000FD2";
export const CHAIN_INFO = "0x0000000000000000000000000000000000000Fd3";
export const DECODER_TESTNET = "0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f";
export const PROVER_URL = "https://prover.cc3-testnet.creditcoin.network";
export const CREDITCOIN_RPC = "https://rpc.cc3-testnet.creditcoin.network";
export const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
export const PAIDLINE_ADDRESS = "0xA682c66F28a897191018F528bd8a69F0c47E992E";
export const PAIDLINE_DEPLOY_TX =
  "0x33e4435f337814d2c0d3d807a88954a481fa8c643c9eabb90bcde950a754ef08";
export const CREDITCOIN_EXPLORER = "https://creditcoin-testnet.blockscout.com";
export const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";
export const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export const SOURCE_DECIMALS = 6;
export const LOCAL_DECIMALS = 18;

export const NETWORKS = {
  sepolia: {
    name: "Ethereum",
    chainKey: SEPOLIA_CHAIN_KEY,
    chainId: SEPOLIA_CHAIN_ID,
    tokenSymbol: "USDC",
    tokenName: "USD Coin",
    network: "Sepolia",
  },
  creditcoin: {
    name: "Creditcoin",
    chainId: CREDITCOIN_TESTNET_CHAIN_ID,
    tokenSymbol: "tCTC",
    tokenName: "Creditcoin",
    network: "CC3 testnet",
  },
} as const;
