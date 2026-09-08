#!/usr/bin/env node
/**
 * Hits the real Attestcoin prover and the Creditcoin precompile.
 * No wallet. verify() is a view.
 *
 * Default: a known Sepolia USDC transfer that is below the attested height.
 */
import { Contract, JsonRpcProvider } from "ethers";
import { blockProver } from "@gluwa/usc-sdk";
import { decodeEvmV1Transaction } from "@gluwa/usc-sdk/dist/utils/decoder.js";
import decoderAbi from "@gluwa/usc-sdk/dist/utils/evmV1DecoderAbi.json" with { type: "json" };

const PROVER = process.env.PROOF_BUILDER_URL ?? "https://prover.cc3-testnet.creditcoin.network";
const CTC_RPC = process.env.CREDITCOIN_RPC_URL ?? "https://rpc.cc3-testnet.creditcoin.network";
const DECODER = "0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f";
const CHAIN_KEY = Number(process.env.SOURCE_CHAIN_KEY ?? "1");
const TX =
  process.argv[2] ??
  "0xad3d0dcfa4ab4f66020b0cd098838737719e4a433eb18edb9abbf7576ce8e517";

const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const proofUrl = `${PROVER.replace(/\/$/, "")}/api/v1/proof-by-tx/${CHAIN_KEY}/${TX}`;
console.log("prover", proofUrl);

const proofRes = await fetch(proofUrl);
const body = await proofRes.text();
if (!proofRes.ok) {
  console.error("PROOF_FAIL", proofRes.status, body.slice(0, 500));
  process.exit(1);
}
const proof = JSON.parse(body);
console.log(
  JSON.stringify(
    {
      chainKey: proof.chainKey,
      headerNumber: proof.headerNumber,
      txIndex: proof.txIndex,
      txHash: proof.txHash,
      txBytesBytes: (proof.txBytes.length - 2) / 2,
      merkleSiblings: proof.merkleProof.siblings.length,
      continuityRoots: proof.continuityProof.roots.length,
      cached: proof.cached,
      generatedAt: proof.generatedAt,
    },
    null,
    2,
  ),
);

const ctc = new JsonRpcProvider(CTC_RPC);
const prover = new blockProver.PrecompileBlockProver(ctc);

let verified = false;
let verifyError = null;
try {
  verified = await prover.verifySingle(
    proof.chainKey,
    proof.headerNumber,
    proof.txBytes,
    proof.merkleProof,
    proof.continuityProof,
  );
} catch (err) {
  verifyError = err?.shortMessage ?? err?.message ?? String(err);
}

console.log(JSON.stringify({ precompile: "0x0FD2", verified, verifyError }, null, 2));

const decoder = new Contract(DECODER, decoderAbi, ctc);
const decoded = await decodeEvmV1Transaction(proof.txBytes, decoder);
const receipt = decoded.data?.receipt ?? decoded.receipt ?? decoded.data;
const logs = receipt?.receiptLogs ?? receipt?.logs ?? [];
const transfers = [];
for (const log of logs) {
  const topics = log.topics ?? [];
  if (topics[0]?.toLowerCase() !== TRANSFER) continue;
  const to = "0x" + (topics[2] ?? "").slice(-40);
  const amount = BigInt(log.data || "0x0");
  transfers.push({ token: log.address_, to, amount: amount.toString() });
}

console.log(
  JSON.stringify(
    {
      txType: decoded.type,
      receiptStatus: receipt?.receiptStatus,
      logCount: logs.length,
      transfers,
    },
    null,
    2,
  ),
);
