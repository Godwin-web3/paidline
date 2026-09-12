import assert from "node:assert/strict";
import test from "node:test";
import { USDC_SEPOLIA, SEPOLIA_CHAIN_KEY } from "./constants.ts";
import { buildTransferLog, matchInvoice, receiptFromTransfer } from "./engine.ts";
import type { Invoice } from "./types.ts";

const MERCHANT = "0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8";
const BUYER = "0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE";
const OTHER = "0x0000000000000000000000000000000000000002";

function invoice(over: Partial<Invoice> = {}): Invoice {
  return {
    id: 1,
    title: "Retainer",
    releaseLabel: "Delivery of the work",
    merchant: MERCHANT,
    chainKey: SEPOLIA_CHAIN_KEY,
    sourceToken: USDC_SEPOLIA,
    sourceRecipient: MERCHANT,
    sourceAmount: 25_000_000n,
    expiry: Math.floor(Date.now() / 1000) + 3600,
    localToken: "0x0000000000000000000000000000000000000000",
    localAmount: 10n ** 16n,
    localReleaseTo: MERCHANT,
    status: "unpaid",
    paidTxHash: null,
    createdAt: Date.now(),
    paidAt: null,
    funded: true,
    ...over,
  };
}

function receipt(over: Parameters<typeof receiptFromTransfer>[0] extends infer T ? Partial<T> : never = {}) {
  return receiptFromTransfer({
    txHash: "0x" + "ab".repeat(32),
    chainKey: SEPOLIA_CHAIN_KEY,
    blockNumber: 1,
    status: 1,
    token: USDC_SEPOLIA,
    from: BUYER,
    to: MERCHANT,
    amount: 25_000_000n,
    ...over,
  });
}

test("matching transfer pays the invoice", () => {
  const r = matchInvoice(invoice(), receipt(), new Set(), true);
  assert.equal(r.ok, true);
});

test("reverted receipt is not a payment", () => {
  const r = matchInvoice(invoice(), receipt({ status: 0 }), new Set(), true);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "reverted");
});

test("wrong token is rejected", () => {
  const r = matchInvoice(
    invoice(),
    receipt({ token: "0x0000000000000000000000000000000000000001" }),
    new Set(),
    true,
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "token_mismatch");
});

test("wrong recipient is rejected", () => {
  const r = matchInvoice(invoice(), receipt({ to: OTHER }), new Set(), true);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "recipient_mismatch");
});

test("short payment is rejected", () => {
  const r = matchInvoice(invoice(), receipt({ amount: 1n }), new Set(), true);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "amount_mismatch");
});

test("overpayment is rejected", () => {
  const r = matchInvoice(invoice(), receipt({ amount: 25_000_001n }), new Set(), true);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "amount_mismatch");
});

test("replay is rejected", () => {
  const rec = receipt();
  const r = matchInvoice(invoice(), rec, new Set([rec.txHash]), true);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "replay");
});

test("unfunded escrow is rejected", () => {
  const r = matchInvoice(invoice({ funded: false }), receipt(), new Set(), true);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "unfunded");
});

test("bad proof never reaches the matcher win path", () => {
  const r = matchInvoice(invoice(), receipt(), new Set(), false);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "proof_invalid");
});

test("a transfer to another merchant cannot close this invoice", () => {
  const r = matchInvoice(invoice(), receipt({ to: BUYER }), new Set(), true);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "recipient_mismatch");
});

test("a later matching Transfer still pays when an earlier same-token log is to someone else", () => {
  const inv = invoice();
  const rec = receipt();
  rec.logs = [
    buildTransferLog(USDC_SEPOLIA, BUYER, OTHER, 25_000_000n),
    buildTransferLog(USDC_SEPOLIA, BUYER, MERCHANT, 25_000_000n),
  ];
  const r = matchInvoice(inv, rec, new Set(), true);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.transfer.to.toLowerCase(), MERCHANT.toLowerCase());
});
