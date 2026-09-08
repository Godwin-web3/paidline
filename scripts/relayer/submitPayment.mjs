#!/usr/bin/env node
/**
 * Dumb relayer. Fetches a proof. Submits it. Asserts nothing.
 *
 *   CREDITCOIN_RPC_URL
 *   CREDITCOIN_WALLET_PRIVATE_KEY
 *   PAIDLINE_ADDRESS
 *   PROOF_BUILDER_URL
 *   SOURCE_CHAIN_RPC_URL
 *   SOURCE_CHAIN_KEY   (Sepolia on CC3 testnet = 1)
 *
 *   node scripts/relayer/submitPayment.mjs <invoiceId> <sepoliaTxHash>
 */
import { Contract, JsonRpcProvider, Wallet } from "ethers";

const ABI = [
  "function submitPayment(uint256 invoiceId,bytes32 sourceTxHash,uint64 chainKey,uint64 blockHeight,bytes encodedTransaction,bytes32 merkleRoot,(bytes32 hash,bool isLeft)[] siblings,bytes32 lowerEndpointDigest,bytes32[] continuityRoots) returns (bool)",
];

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const [invoiceIdRaw, txHash] = process.argv.slice(2);
if (!invoiceIdRaw || !txHash) {
  fail("Usage: node scripts/relayer/submitPayment.mjs <invoiceId> <sepoliaTxHash>");
}

const invoiceId = BigInt(invoiceIdRaw);
if (!txHash.startsWith("0x") || txHash.length !== 66) fail("Invalid tx hash.");

const {
  CREDITCOIN_RPC_URL,
  CREDITCOIN_WALLET_PRIVATE_KEY,
  PAIDLINE_ADDRESS,
  PROOF_BUILDER_URL,
  SOURCE_CHAIN_KEY,
} = process.env;

if (!CREDITCOIN_RPC_URL || !CREDITCOIN_WALLET_PRIVATE_KEY || !PAIDLINE_ADDRESS) {
  fail("Missing CREDITCOIN_RPC_URL, CREDITCOIN_WALLET_PRIVATE_KEY, or PAIDLINE_ADDRESS.");
}

const chainKey = Number(SOURCE_CHAIN_KEY || "1");
const proofBuilderUrl = (PROOF_BUILDER_URL || "https://prover.cc3-testnet.creditcoin.network").replace(
  /\/$/,
  "",
);

const proofRes = await fetch(`${proofBuilderUrl}/api/v1/proof-by-tx/${chainKey}/${txHash}`);

if (!proofRes.ok) {
  fail(`Proof builder ${proofRes.status}: ${await proofRes.text()}`);
}

const proof = await proofRes.json();
const provider = new JsonRpcProvider(CREDITCOIN_RPC_URL);
const wallet = new Wallet(CREDITCOIN_WALLET_PRIVATE_KEY, provider);
const paidline = new Contract(PAIDLINE_ADDRESS, ABI, wallet);

const tx = await paidline.submitPayment(
  invoiceId,
  txHash,
  proof.chainKey ?? chainKey,
  proof.headerNumber,
  proof.txBytes,
  proof.merkleProof.root,
  proof.merkleProof.siblings,
  proof.continuityProof.lowerEndpointDigest,
  proof.continuityProof.roots,
  { gasLimit: 8_000_000 },
);
const receipt = await tx.wait();
console.log(JSON.stringify({ creditcoinTx: receipt.hash, invoiceId: invoiceId.toString() }, null, 2));
