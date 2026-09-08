export type InvoiceStatus = "unpaid" | "paid" | "cancelled" | "expired";

export type Invoice = {
  id: number;
  title: string;
  releaseLabel: string;
  merchant: string;
  chainKey: number;
  sourceToken: string;
  sourceRecipient: string;
  sourceAmount: bigint;
  expiry: number;
  localToken: string;
  localAmount: bigint;
  localReleaseTo: string;
  status: InvoiceStatus;
  paidTxHash: string | null;
  createdAt: number;
  paidAt: number | null;
  funded: boolean;
};

export type InvoiceWire = Omit<Invoice, "sourceAmount" | "localAmount"> & {
  sourceAmount: string;
  localAmount: string;
};

export type TransferLog = {
  token: string;
  from: string;
  to: string;
  amount: bigint;
};

export type SourceReceipt = {
  txHash: string;
  chainKey: number;
  blockNumber: number;
  status: 0 | 1;
  logs: TransferLog[];
};

export type MatchFailure =
  | "not_found"
  | "not_unpaid"
  | "expired"
  | "unfunded"
  | "bad_chain"
  | "reverted"
  | "no_transfer"
  | "token_mismatch"
  | "recipient_mismatch"
  | "amount_mismatch"
  | "replay"
  | "proof_invalid";

export type MatchResult =
  | { ok: true; invoice: Invoice; transfer: TransferLog; localReleasedTo: string; localAmount: bigint }
  | { ok: false; reason: MatchFailure; detail: string };
