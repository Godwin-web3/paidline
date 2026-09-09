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
    stampTxHash: null,
    title: String(pick(row, "title", 11) ?? ""),
    releaseLabel: String(pick(row, "releaseLabel", 12) ?? ""),
    createdAt: 0,
    paidAt: statusNum === 1 ? Date.now() : null,
  };
}

export async function readInvoice(id: number): Promise<Invoice | null> {
  const c = contract();
  const row = await c.invoices(id);
  const inv = mapInvoice(id, row as unknown as Record<string, unknown>);
  if (!inv || inv.status !== "paid") return inv;
  try {
    const logs = await c.queryFilter(c.filters.InvoicePaid(id));
    const hash = logs[0] && "transactionHash" in logs[0] ? String(logs[0].transactionHash) : null;
    return { ...inv, stampTxHash: hash };
  } catch {
    return inv;
  }
}

export async function readSettled(limit = 12): Promise<Invoice[]> {
  try {
    const c = contract();
    const p = provider();
    const latest = await p.getBlockNumber();
    const from = Math.max(0, latest - 4000);
    const logs = await c.queryFilter(c.filters.InvoicePaid(), from);
    const ids: number[] = [];
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i] as { args?: { invoiceId?: bigint } };
      const id = Number(log.args?.invoiceId ?? 0);
      if (id > 0 && !ids.includes(id)) ids.push(id);
      if (ids.length >= limit) break;
    }
    if (ids.length === 0) {
      const next = Number(await c.nextInvoiceId());
      for (let i = next - 1; i >= Math.max(1, next - 16) && ids.length < limit; i--) ids.push(i);
    }
    const rows = await Promise.all(ids.map((id) => readInvoice(id)));
    return rows.filter((inv): inv is Invoice => inv !== null && inv.status === "paid");
  } catch {
    return [];
  }
}

export async function readOpen(limit = 24): Promise<Invoice[]> {
  try {
    const c = contract();
    const next = Number(await c.nextInvoiceId());
    if (!Number.isFinite(next) || next < 2) return [];
    const ids: number[] = [];
    for (let i = next - 1; i >= 1 && ids.length < 64; i--) ids.push(i);
    const rows = await Promise.all(ids.map((id) => readInvoice(id)));
    return rows
      .filter((inv): inv is Invoice => inv !== null && inv.status === "unpaid" && inv.funded)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function readInvoices(merchant: string): Promise<Invoice[]> {
  const ids = (await contract().invoicesOf(merchant)) as bigint[];
  if (!ids.length) return [];
  const rows = await Promise.all(ids.map((id) => readInvoice(Number(id))));
  return rows.filter((x): x is Invoice => x !== null).reverse();
}
