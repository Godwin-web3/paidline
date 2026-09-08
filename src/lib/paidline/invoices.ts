import { createServerFn } from "@tanstack/react-start";
import { existsSync, readFileSync } from "node:fs";
import { Contract, JsonRpcProvider, Wallet, zeroPadValue } from "ethers";
import { PAIDLINE_ABI } from "./abi.ts";
import { readInvoice, readInvoices } from "./chain.ts";
import {
  CREDITCOIN_RPC,
  PAIDLINE_ADDRESS,
  PROVER_URL,
  SEPOLIA_CHAIN_KEY,
  SEPOLIA_RPC,
  TRANSFER_TOPIC,
  USDC_SEPOLIA,
} from "./constants.ts";

function toWire(inv: Awaited<ReturnType<typeof readInvoice>>) {
  if (!inv) return null;
  return {
    ...inv,
    sourceAmount: inv.sourceAmount.toString(),
    localAmount: inv.localAmount.toString(),
  };
}

export const getInvoice = createServerFn({ method: "GET" })
  .validator((d: { id: number }) => {
    const id = Number(d?.id);
    if (!Number.isInteger(id) || id < 1) throw new Error("Bad invoice id.");
    return { id };
  })
  .handler(async ({ data }) => toWire(await readInvoice(data.id)));

export const listInvoices = createServerFn({ method: "GET" })
  .validator((d: unknown) => {
    const merchant =
      typeof d === "object" && d && "merchant" in d
        ? String((d as { merchant?: string }).merchant ?? "")
        : "";
    return { merchant: /^0x[a-fA-F0-9]{40}$/i.test(merchant) ? merchant : "" };
  })
  .handler(async ({ data }) => {
    if (!data.merchant) return [];
    const rows = await readInvoices(data.merchant);
    return rows.map((inv) => ({
      ...inv,
      sourceAmount: inv.sourceAmount.toString(),
      localAmount: inv.localAmount.toString(),
    }));
  });

export type ConfirmResult = {
  ok: boolean;
  error?: string;
  creditcoinTx?: string;
  status?: string;
};

type Proof = {
  chainKey: number;
  headerNumber: number;
  txBytes: string;
  merkleProof: { root: string; siblings: { hash: string; isLeft: boolean }[] };
  continuityProof: { lowerEndpointDigest: string; roots: string[] };
};

function relayerKey(): string | null {
  const env = process.env.CREDITCOIN_WALLET_PRIVATE_KEY || process.env.RELAYER_PRIVATE_KEY;
  if (env && /^0x[a-fA-F0-9]{64}$/.test(env)) return env;
  const file = process.env.RELAYER_KEY_FILE || "/workspace/.grok/deploy-wallet.json";
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as { privateKey?: string };
    return parsed.privateKey && parsed.privateKey.startsWith("0x") ? parsed.privateKey : null;
  } catch {
    return null;
  }
}

function humanRevert(msg: string): string {
  if (/RecipientMismatch/i.test(msg)) return "This transfer was not sent to the invoice address.";
  if (/AmountMismatch/i.test(msg)) return "This transfer is not the exact amount due.";
  if (/TokenMismatch/i.test(msg)) return "This is not the token this invoice asked for.";
  if (/Replay/i.test(msg)) return "This payment already settled an invoice.";
  if (/NotUnpaid/i.test(msg)) return "This invoice is no longer open.";
  if (/Expired/i.test(msg)) return "This invoice expired.";
  if (/Unfunded/i.test(msg)) return "This invoice has no Creditcoin locked against it.";
  if (/UnknownInvoice/i.test(msg)) return "Invoice not found.";
  if (/BadChain/i.test(msg)) return "This payment is on the wrong chain.";
  if (/SourceReverted/i.test(msg)) return "The Ethereum transaction reverted.";
  if (/NoTransfer/i.test(msg)) return "No token transfer was found in that transaction.";
  if (/nonce|already known|replacement/i.test(msg)) {
    return "Another confirmation is in flight. Wait a moment and try again.";
  }
  return msg.slice(0, 280);
}

async function fetchProof(txHash: string): Promise<{ ok: true; proof: Proof } | { ok: false; error: string }> {
  const url = `${PROVER_URL}/api/v1/proof-by-tx/${SEPOLIA_CHAIN_KEY}/${txHash}`;
  let last = "The payment could not be confirmed yet.";
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(url);
    const text = await res.text();
    if (res.ok) {
      return { ok: true, proof: JSON.parse(text) as Proof };
    }
    last = `Confirmation service ${res.status}: ${text.slice(0, 180)}`;
    if (res.status === 404 || res.status === 409 || res.status === 425 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 2500));
      continue;
    }
    return { ok: false, error: humanRevert(last) };
  }
  return { ok: false, error: "The transfer is not confirmed yet. Wait a moment and try again." };
}

let submitQueue: Promise<unknown> = Promise.resolve();

function enqueueSubmit<T>(fn: () => Promise<T>): Promise<T> {
  const run = submitQueue.then(fn, fn);
  submitQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export const confirmPayment = createServerFn({ method: "POST" })
  .validator((d: { invoiceId: number; txHash: string }) => {
    const invoiceId = Number(d?.invoiceId);
    const txHash = (d?.txHash ?? "").trim();
    if (!Number.isInteger(invoiceId) || invoiceId < 1) throw new Error("Bad invoice id.");
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) throw new Error("Need a 32-byte transaction hash.");
    return { invoiceId, txHash };
  })
  .handler(async ({ data }): Promise<ConfirmResult> => {
    const invoice = await readInvoice(data.invoiceId);
    if (!invoice) return { ok: false, error: "Invoice not found." };
    if (invoice.status === "paid") return { ok: true, status: "paid" };
    if (invoice.status === "cancelled") return { ok: false, error: "This invoice was cancelled." };
    if (invoice.status === "expired") return { ok: false, error: "This invoice expired." };

    const proof = await fetchProof(data.txHash);
    if (!proof.ok) return { ok: false, error: proof.error };

    const key = relayerKey();
    if (!key) return { ok: false, error: "Payment confirmation is not configured on this host." };

    return enqueueSubmit(async () => {
      const latest = await readInvoice(data.invoiceId);
      if (latest?.status === "paid") return { ok: true, status: "paid" };
      if (latest?.status === "cancelled") return { ok: false, error: "This invoice was cancelled." };

      const wallet = new Wallet(key, new JsonRpcProvider(CREDITCOIN_RPC));
      const paidline = new Contract(PAIDLINE_ADDRESS, PAIDLINE_ABI, wallet);
      try {
        const nonce = await wallet.getNonce("pending");
        const tx = await paidline.submitPayment(
          data.invoiceId,
          data.txHash,
          proof.proof.chainKey,
          proof.proof.headerNumber,
          proof.proof.txBytes,
          proof.proof.merkleProof.root,
          proof.proof.merkleProof.siblings,
          proof.proof.continuityProof.lowerEndpointDigest,
          proof.proof.continuityProof.roots,
          { gasLimit: 8_000_000, nonce },
        );
        const rcpt = await tx.wait();
        return { ok: true, creditcoinTx: rcpt.hash as string, status: "paid" };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const again = await readInvoice(data.invoiceId);
        if (again?.status === "paid") return { ok: true, status: "paid" };
        return { ok: false, error: humanRevert(msg) };
      }
    });
  });

export const findMatchingTransfer = createServerFn({ method: "GET" })
  .validator((d: { invoiceId: number }) => {
    const invoiceId = Number(d?.invoiceId);
    if (!Number.isInteger(invoiceId) || invoiceId < 1) throw new Error("Bad invoice id.");
    return { invoiceId };
  })
  .handler(async ({ data }): Promise<{ hash: string | null }> => {
    const invoice = await readInvoice(data.invoiceId);
    if (!invoice || invoice.status !== "unpaid") return { hash: null };
    try {
      const provider = new JsonRpcProvider(SEPOLIA_RPC);
      const latest = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latest - 4000);
      const toTopic = zeroPadValue(invoice.sourceRecipient, 32);
      const logs = await provider.getLogs({
        address: USDC_SEPOLIA,
        topics: [TRANSFER_TOPIC, null, toTopic],
        fromBlock,
        toBlock: latest,
      });
      const amount = BigInt(invoice.sourceAmount);
      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];
        if (!log) continue;
        if (log.data.length < 66) continue;
        const value = BigInt(log.data);
        if (value === amount && log.transactionHash) return { hash: log.transactionHash };
      }
    } catch {
      return { hash: null };
    }
    return { hash: null };
  });
