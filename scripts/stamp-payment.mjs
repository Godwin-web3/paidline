#!/usr/bin/env node
/**
 * Stamp an existing Sepolia payment once Attestcoin's 32-block window clears.
 *   STAMP_INVOICE_ID=9 STAMP_TX=0x... node scripts/stamp-payment.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { Contract, JsonRpcProvider, Wallet } from "ethers";

const PAIDLINE = "0x4fB6aB16B3CEf1853DF4247b245E4de139108339";
const CC3 = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
const PROVER = (process.env.PROOF_BUILDER_URL || "https://prover.cc3-testnet.creditcoin.network").replace(
  /\/$/,
  "",
);
const CHAIN_KEY = 1;
const INVOICE_ID = Number(process.env.STAMP_INVOICE_ID || "9");
const TX = (process.env.STAMP_TX || "").trim();

const ABI = [
  "function isPaid(uint256 invoiceId) view returns (bool)",
  "function submitPayment(uint256 invoiceId,bytes32 sourceTxHash,uint64 chainKey,uint64 blockHeight,bytes encodedTransaction,bytes32 merkleRoot,(bytes32 hash,bool isLeft)[] siblings,bytes32 lowerEndpointDigest,bytes32[] continuityRoots) returns (bool)",
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

if (!Number.isInteger(INVOICE_ID) || INVOICE_ID < 1) throw new Error("Bad invoice id.");
if (!/^0x[a-fA-F0-9]{64}$/.test(TX)) throw new Error("Need STAMP_TX.");

const cc3 = new JsonRpcProvider(CC3, 102031, { staticNetwork: true });
const merchant = new Wallet(key(), cc3);
const paidline = new Contract(PAIDLINE, ABI, merchant);

if (await paidline.isPaid(INVOICE_ID)) {
  log("already.paid", { invoiceId: INVOICE_ID });
  process.exit(0);
}

let proof = null;
let last = "no proof yet";
for (let i = 0; i < 90; i++) {
  const res = await fetch(`${PROVER}/api/v1/proof-by-tx/${CHAIN_KEY}/${TX}`);
  const text = await res.text();
  if (res.ok) {
    proof = JSON.parse(text);
    break;
  }
  last = `${res.status}: ${text.slice(0, 220)}`;
  log("proof.wait", { attempt: i + 1, last });
  await new Promise((r) => setTimeout(r, 8000));
}
if (!proof) throw new Error(`Proof not ready: ${last}`);
log("proof.ok", { headerNumber: proof.headerNumber });

const submitTx = await paidline.submitPayment(
  INVOICE_ID,
  TX,
  proof.chainKey ?? CHAIN_KEY,
  proof.headerNumber,
  proof.txBytes,
  proof.merkleProof.root,
  proof.merkleProof.siblings,
  proof.continuityProof.lowerEndpointDigest,
  proof.continuityProof.roots,
  { gasLimit: 8_000_000, type: 0 },
);
const rcpt = await submitTx.wait();
const paid = await paidline.isPaid(INVOICE_ID);
log("stamp.done", {
  invoiceId: INVOICE_ID,
  creditcoinTx: rcpt.hash,
  sepoliaTx: TX,
  isPaid: paid,
});
if (!paid) process.exit(1);
