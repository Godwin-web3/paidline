import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { InvoiceSheet, SheetMeta } from "@/components/invoice-sheet";
import { SEPOLIA_EXPLORER, SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { confirmPayment, findMatchingTransfer, getInvoice } from "@/lib/paidline/invoices";
import type { InvoiceWire } from "@/lib/paidline/types";
import { hasWallet, sendUsdc } from "@/lib/paidline/wallet";
import { copyText, formatUnits, isTxHash, shortAddr } from "@/lib/utils";

export const Route = createFileRoute("/pay/$id")({ component: BuyerPay });

type Phase = "idle" | "sending" | "watching" | "proving" | "paid" | "failed";

function BuyerPay() {
  const { id } = Route.useParams();
  const invoiceId = Number(id);
  const [invoice, setInvoice] = useState<InvoiceWire | null | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("idle");
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [fail, setFail] = useState<string | null>(null);
  const [showHash, setShowHash] = useState(false);
  const proving = useRef(false);

  useEffect(() => {
    void getInvoice({ data: { id: invoiceId } }).then((inv) => {
      setInvoice(inv);
      if (inv?.status === "paid") setPhase("paid");
    });
  }, [invoiceId]);

  useEffect(() => {
    if (!invoice || invoice.status !== "unpaid") return;
    if (phase === "sending" || phase === "proving" || phase === "paid") return;
    let stop = false;
    async function tick() {
      const found = await findMatchingTransfer({ data: { invoiceId } });
      if (stop || !found.hash || proving.current) return;
      setTxHash(found.hash);
      setPhase("watching");
      await prove(found.hash);
    }
    const t = window.setInterval(() => void tick(), 8000);
    void tick();
    return () => {
      stop = true;
      window.clearInterval(t);
    };
  }, [invoice, invoiceId, phase]);

  async function prove(hash: string) {
    if (proving.current) return;
    proving.current = true;
    setPhase("proving");
    const result = await confirmPayment({ data: { invoiceId, txHash: hash } });
    if (!result.ok) {
      proving.current = false;
      setPhase("failed");
      setFail(result.error ?? "This payment was not accepted.");
      return;
    }
    const next = await getInvoice({ data: { id: invoiceId } });
    setInvoice(next);
    setPhase("paid");
  }

  if (invoice === undefined) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <p className="text-sm text-muted">Loading invoice…</p>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl">This invoice is gone</h1>
        <p className="mt-2 text-sm text-muted">Ask the seller for a current link.</p>
      </main>
    );
  }

  const live = invoice;
  const amount = formatUnits(BigInt(live.sourceAmount), SOURCE_DECIMALS);
  const alreadyPaid = live.status === "paid" || phase === "paid";
  const closed = live.status === "cancelled" || live.status === "expired";

  async function payWithWallet() {
    setFail(null);
    if (!hasWallet()) {
      setFail("Connect a wallet on Ethereum, or send USDC from any wallet. This page watches for it.");
      return;
    }
    setPhase("sending");
    try {
      const hash = await sendUsdc(live.sourceRecipient, BigInt(live.sourceAmount));
      setTxHash(hash);
      await prove(hash);
    } catch (err) {
      proving.current = false;
      setPhase("failed");
      setFail(err instanceof Error ? err.message : "Transfer failed.");
    }
  }

  async function payWithHash(e: React.FormEvent) {
    e.preventDefault();
    if (!isTxHash(txHash)) {
      setFail("Paste the Ethereum transaction hash.");
      return;
    }
    setFail(null);
    await prove(txHash);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8 sm:py-10">
      <InvoiceSheet className="p-6 sm:p-8">
        <p className="text-xs uppercase tracking-wide text-ink-muted">Pay invoice #{invoice.id}</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink">{invoice.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Send {amount} USDC to this address on Ethereum. Use the wallet you already have.
        </p>

        <dl className="mt-8 grid gap-5">
          <SheetMeta label="Amount">
            <span className="font-display text-5xl tabular-nums tracking-tight">
              {amount}
              <span className="ml-2 text-xl text-ink-muted">USDC</span>
            </span>
          </SheetMeta>
          <SheetMeta label="Send to">
            <span className="break-all font-mono text-sm">{invoice.sourceRecipient}</span>
            <button
              type="button"
              className="mt-2 min-h-11 text-xs text-ink-muted underline underline-offset-4"
              onClick={() => {
                void copyText(invoice.sourceRecipient).then((ok) => {
                  if (ok) {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1400);
                  }
                });
              }}
            >
              {copied ? "Address copied" : "Copy address"}
            </button>
          </SheetMeta>
          <SheetMeta label="You receive">{invoice.releaseLabel}</SheetMeta>
        </dl>
      </InvoiceSheet>

      {alreadyPaid ? (
        <div className="mt-8 rounded-xl border border-paid/30 bg-raised px-5 py-4">
          <p className="flex items-center gap-2 text-sm text-paid">
            <Check className="size-4" strokeWidth={2} />
            Paid
          </p>
          <p className="mt-2 text-sm text-muted">{invoice.releaseLabel} is yours.</p>
          {invoice.paidTxHash ? (
            <a
              className="mt-3 inline-block font-mono text-xs text-muted underline underline-offset-4"
              href={`${SEPOLIA_EXPLORER}/tx/${invoice.paidTxHash}`}
              target="_blank"
              rel="noreferrer"
            >
              {shortAddr(invoice.paidTxHash, 8)}
            </a>
          ) : null}
        </div>
      ) : closed ? (
        <p className="mt-8 text-sm text-muted">
          This invoice is {live.status}. Ask the seller for a current one.
        </p>
      ) : (
        <div className="mt-8 grid gap-4">
          <Button
            size="lg"
            className="w-full"
            disabled={phase === "sending" || phase === "proving"}
            onClick={() => void payWithWallet()}
          >
            {phase === "sending"
              ? "Waiting on wallet…"
              : phase === "proving"
                ? "Confirming payment…"
                : `Pay ${amount} USDC`}
          </Button>
          <p className="text-center text-xs text-muted">
            {phase === "watching" || phase === "proving"
              ? "Payment seen. The contract is checking it."
              : "Or send from any wallet. This page watches for the exact amount."}
          </p>
          <button
            type="button"
            className="text-center text-xs text-faint underline underline-offset-4"
            onClick={() => setShowHash((v) => !v)}
          >
            {showHash ? "Hide transaction hash" : "Already sent? Paste the hash"}
          </button>
          {showHash ? (
            <form onSubmit={(e) => void payWithHash(e)} className="grid gap-3">
              <Field label="Ethereum transaction hash">
                <Input value={txHash} onChange={(e) => setTxHash(e.target.value)} spellCheck={false} />
              </Field>
              <Button type="submit" variant="ghost" disabled={phase === "proving"}>
                Confirm payment
              </Button>
            </form>
          ) : null}
          {fail ? <p className="text-sm text-bad">{fail}</p> : null}
        </div>
      )}
    </main>
  );
}
