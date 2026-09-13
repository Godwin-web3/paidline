#!/usr/bin/env node
/**
 * Pay an existing listing and stamp it. Default: invoice 9 (the 10 USDC walkthrough).
 * Uses CREDITCOIN_WALLET_PRIVATE_KEY (or .grok/deploy-wallet.json).
 * Never logs the key.
 *
 *   PAY_INVOICE_ID=9 node scripts/settle-example.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { Contract, JsonRpcProvider, Wallet } from "ethers";

const PAIDLINE = "0x4fB6aB16B3CEf1853DF4247b245E4de139108339";
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const CC3 = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
const SEPOLIA =
  process.env.SOURCE_CHAIN_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const PROVER = (process.env.PROOF_BUILDER_URL || "https://prover.cc3-testnet.creditcoin.network").replace(
  /\/$/,
  "",
);
const CHAIN_KEY = 1;
const INVOICE_ID = Number(process.env.PAY_INVOICE_ID || "9");

const PAIDLINE_ABI = [
  "function isPaid(uint256 invoiceId) view returns (bool)",
  "function invoices(uint256) view returns (address merchant,uint256 chainKey,address sourceToken,address sourceRecipient,uint256 sourceAmount,uint64 expiry,uint256 localAmount,address localReleaseTo,uint8 status,bool funded,bytes32 paidTxHash,string title,string releaseLabel)",
  "function submitPayment(uint256 invoiceId,bytes32 sourceTxHash,uint64 chainKey,uint64 blockHeight,bytes encodedTransaction,bytes32 merkleRoot,(bytes32 hash,bool isLeft)[] siblings,bytes32 lowerEndpointDigest,bytes32[] continuityRoots) returns (bool)",
];
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to,uint256 value) returns (bool)",
];

function key() {
  const env = process.env.CREDITCOIN_WALLET_PRIVATE_KEY || process.env.RELAYER_PRIVATE_KEY;
  if (env && /^0x[a-fA-F0-9]{64}$/.test(env)) return env;
  const file = "/workspace/.grok/deploy-wallet.json";
  if (!existsSync(file)) throw new Error("No relayer key.");
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  if (!parsed.privateKey?.startsWith("0x")) throw new Error("Bad key file.");
  return parsed.privateKey;
}

function log(step, extra = {}) {
  console.log(JSON.stringify({ step, ...extra }));
}

async function waitProof(txHash) {
  const url = `${PROVER}/api/v1/proof-by-tx/${CHAIN_KEY}/${txHash}`;
  let last = "no proof yet";
  for (let i = 0; i < 36; i++) {
    const res = await fetch(url);
    const text = await res.text();
    if (res.ok) return JSON.parse(text);
    last = `${res.status}: ${text.slice(0, 180)}`;
    log("proof.wait", { attempt: i + 1, last });
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`Proof not ready: ${last}`);
}

if (!Number.isInteger(INVOICE_ID) || INVOICE_ID < 1) {
  throw new Error("PAY_INVOICE_ID must be a positive integer.");
}

const walletKey = key();
const cc3 = new JsonRpcProvider(CC3, 102031, { staticNetwork: true });
const sepolia = new JsonRpcProvider(SEPOLIA, 11155111, { staticNetwork: true });
const merchant = new Wallet(walletKey, cc3);
const payer = new Wallet(walletKey, sepolia);
const paidline = new Contract(PAIDLINE, PAIDLINE_ABI, merchant);
const usdc = new Contract(USDC, ERC20_ABI, payer);

const eth = await sepolia.getBalance(payer.address);
const usdcBal = await usdc.balanceOf(payer.address);
const tctc = await cc3.getBalance(merchant.address);
log("balances", {
  address: merchant.address,
  sepoliaEth: eth.toString(),
  usdc: usdcBal.toString(),
  tctc: tctc.toString(),
});

const already = await paidline.isPaid(INVOICE_ID);
if (already) {
  log("already.paid", { invoiceId: INVOICE_ID });
  process.exit(0);
}

const inv = await paidline.invoices(INVOICE_ID);
if (!inv.funded || inv.merchant === "0x0000000000000000000000000000000000000000") {
  console.error(`Listing ${INVOICE_ID} is missing or unfunded.`);
  process.exit(2);
}
const amount = inv.sourceAmount;
log("listing", {
  invoiceId: INVOICE_ID,
  title: inv.title,
  amount: amount.toString(),
  recipient: inv.sourceRecipient,
});

if (eth === 0n) {
  console.error("Need a pinch of Sepolia ETH for gas. USDC is there; ETH is not.");
  process.exit(2);
}

if (usdcBal < amount) {
  console.error("Not enough USDC.");
  process.exit(2);
}

const payTx = await usdc.transfer(inv.sourceRecipient, amount, { type: 0 });
const payRcpt = await payTx.wait();
log("pay.done", { sepoliaTx: payRcpt.hash });

const proof = await waitProof(payRcpt.hash);
log("proof.ok", { headerNumber: proof.headerNumber });

const submitTx = await paidline.submitPayment(
  INVOICE_ID,
  payRcpt.hash,
  proof.chainKey ?? CHAIN_KEY,
  proof.headerNumber,
  proof.txBytes,
  proof.merkleProof.root,
  proof.merkleProof.siblings,
  proof.continuityProof.lowerEndpointDigest,
  proof.continuityProof.roots,
  { gasLimit: 8_000_000, type: 0 },
);
const submitRcpt = await submitTx.wait();
const paid = await paidline.isPaid(INVOICE_ID);
log("stamp.done", {
  invoiceId: INVOICE_ID,
  creditcoinTx: submitRcpt.hash,
  sepoliaTx: payRcpt.hash,
  isPaid: paid,
  amount: amount.toString(),
});
if (!paid) process.exit(1);
