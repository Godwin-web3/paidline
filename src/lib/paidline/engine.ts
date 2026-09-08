import type { Invoice, MatchResult, SourceReceipt, TransferLog } from "./types.ts";

const ZERO = "0x0000000000000000000000000000000000000000";

function norm(addr: string): string {
  return addr.toLowerCase();
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

export function keccakTopicAddress(addr: string): string {
  return "0x" + addr.slice(2).toLowerCase().padStart(64, "0");
}

export function encodeAmount(amount: bigint): string {
  return "0x" + amount.toString(16).padStart(64, "0");
}

export function buildTransferLog(token: string, from: string, to: string, amount: bigint): TransferLog {
  return { token, from, to, amount };
}

export function receiptFromTransfer(opts: {
  txHash: string;
  chainKey: number;
  blockNumber: number;
  status: 0 | 1;
  token: string;
  from: string;
  to: string;
  amount: bigint;
}): SourceReceipt {
  return {
    txHash: opts.txHash,
    chainKey: opts.chainKey,
    blockNumber: opts.blockNumber,
    status: opts.status,
    logs: opts.status === 1 ? [buildTransferLog(opts.token, opts.from, opts.to, opts.amount)] : [],
  };
}

export function matchInvoice(
  invoice: Invoice | undefined,
  receipt: SourceReceipt,
  usedTxHashes: Set<string>,
  proofOk: boolean,
): MatchResult {
  if (!invoice) {
    return { ok: false, reason: "not_found", detail: "No invoice with that id." };
  }
  if (!proofOk) {
    return { ok: false, reason: "proof_invalid", detail: "The inclusion proof was rejected." };
  }
  if (invoice.status === "cancelled") {
    return { ok: false, reason: "not_unpaid", detail: "Invoice was cancelled." };
  }
  if (invoice.status === "paid") {
    return { ok: false, reason: "not_unpaid", detail: "Invoice is already paid." };
  }
  if (invoice.status === "expired" || invoice.expiry <= nowSec()) {
    return { ok: false, reason: "expired", detail: "Invoice expired before the payment was confirmed." };
  }
  if (!invoice.funded) {
    return { ok: false, reason: "unfunded", detail: "No Creditcoin is locked against this invoice." };
  }
  if (receipt.chainKey !== invoice.chainKey) {
    return { ok: false, reason: "bad_chain", detail: `Expected chain key ${invoice.chainKey}, got ${receipt.chainKey}.` };
  }
  if (receipt.status !== 1) {
    return { ok: false, reason: "reverted", detail: "The source transaction reverted." };
  }
  if (usedTxHashes.has(norm(receipt.txHash))) {
    return { ok: false, reason: "replay", detail: "This transaction already paid an invoice." };
  }

  if (!receipt.logs.length) {
    return { ok: false, reason: "no_transfer", detail: "No Transfer log in the verified receipt." };
  }

  const sameToken = receipt.logs.find((log) => norm(log.token) === norm(invoice.sourceToken));
  if (!sameToken) {
    return {
      ok: false, reason: "token_mismatch",
      detail: `Expected token ${invoice.sourceToken}.`,
    };
  }
  if (norm(sameToken.to) !== norm(invoice.sourceRecipient)) {
    return {
      ok: false, reason: "recipient_mismatch",
      detail: `Expected recipient ${invoice.sourceRecipient}.`,
    };
  }
  if (sameToken.amount !== invoice.sourceAmount) {
    return {
      ok: false, reason: "amount_mismatch",
      detail: `Expected exactly ${invoice.sourceAmount.toString()} units. Got ${sameToken.amount.toString()}.`,
    };
  }

  return {
    ok: true,
    invoice,
    transfer: sameToken,
    localReleasedTo: invoice.localReleaseTo || ZERO,
    localAmount: invoice.localAmount,
  };
}

export function failureLabel(reason: import("./types.ts").MatchFailure): string {
  switch (reason) {
    case "not_found":
      return "Unknown invoice";
    case "not_unpaid":
      return "Wrong status";
    case "expired":
      return "Expired";
    case "unfunded":
      return "Nothing locked";
    case "bad_chain":
      return "Wrong chain";
    case "reverted":
      return "Source reverted";
    case "no_transfer":
      return "No Transfer";
    case "token_mismatch":
      return "Wrong token";
    case "recipient_mismatch":
      return "Wrong recipient";
    case "amount_mismatch":
      return "Wrong amount";
    case "replay":
      return "Replay";
    case "proof_invalid":
      return "Proof failed";
    default:
      return "Rejected";
  }
}
