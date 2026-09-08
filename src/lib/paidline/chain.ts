import { Contract, JsonRpcProvider } from "ethers";
import { PAIDLINE_ABI } from "./abi.ts";
import { CREDITCOIN_RPC, PAIDLINE_ADDRESS } from "./constants.ts";
import type { Invoice, InvoiceStatus } from "./types.ts";

const STATUSES: InvoiceStatus[] = ["unpaid", "paid", "cancelled"];
const ZERO_HASH = "0x" + "00".repeat(32);

function provider() {
  return new JsonRpcProvider(CREDITCOIN_RPC);
}

function contract(p = provider()) {
  return new Contract(PAIDLINE_ADDRESS, PAIDLINE_ABI, p);
}

function pick(row: Record<string, unknown> | unknown[], key: string, index: number): unknown {
  if (Array.isArray(row)) return row[index];
  return row[key] ?? row[String(index)];
}

function mapInvoice(id: number, row: Record<string, unknown> | unknown[]): Invoice | null {
  const merchant = String(pick(row, "merchant", 0) ?? "");
  if (!merchant || merchant === "0x0000000000000000000000000000000000000000") return null;
  const statusNum = Number(pick(row, "status", 8) ?? 0);
  const paid = String(pick(row, "paidTxHash", 10) ?? ZERO_HASH);
  const expiry = Number(pick(row, "expiry", 5) ?? 0);
  let status: InvoiceStatus = STATUSES[statusNum] ?? "unpaid";
  if (status === "unpaid" && expiry * 1000 < Date.now()) status = "expired";
  return {
    id,
    merchant,
    chainKey: Number(pick(row, "chainKey", 1) ?? 0),
    sourceToken: String(pick(row, "sourceToken", 2)),
    sourceRecipient: String(pick(row, "sourceRecipient", 3)),
    sourceAmount: BigInt(pick(row, "sourceAmount", 4) as bigint),
    expiry,
    localToken: "0x0000000000000000000000000000000000000000",
    localAmount: BigInt(pick(row, "localAmount", 6) as bigint),
    localReleaseTo: String(pick(row, "localReleaseTo", 7)),
    status,
    funded: Boolean(pick(row, "funded", 9)),
    paidTxHash: paid === ZERO_HASH ? null : paid,
    title: String(pick(row, "title", 11) ?? ""),
    releaseLabel: String(pick(row, "releaseLabel", 12) ?? ""),
    createdAt: 0,
    paidAt: statusNum === 1 ? Date.now() : null,
  };
}

export async function readInvoice(id: number): Promise<Invoice | null> {
  const row = await contract().invoices(id);
  return mapInvoice(id, row as unknown as Record<string, unknown>);
}

export async function readInvoices(merchant: string): Promise<Invoice[]> {
  const ids = (await contract().invoicesOf(merchant)) as bigint[];
  if (!ids.length) return [];
  const rows = await Promise.all(ids.map((id) => readInvoice(Number(id))));
  return rows.filter((x): x is Invoice => x !== null).reverse();
}
