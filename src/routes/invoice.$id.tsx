import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { InvoiceSheet, SheetMeta } from "@/components/invoice-sheet";
import { SheetSkeleton } from "@/components/skeleton";
import {
  CREDITCOIN_EXPLORER,
  LOCAL_DECIMALS,
  SEPOLIA_EXPLORER,
  SOURCE_DECIMALS,
} from "@/lib/paidline/constants";
import { getInvoice } from "@/lib/paidline/invoices";
import { useSession } from "@/lib/paidline/session";
import type { InvoiceWire } from "@/lib/paidline/types";
import { cancelOnchain, hasWallet } from "@/lib/paidline/wallet";
import { copyText, formatDue, formatUnits, shortAddr } from "@/lib/utils";

export const Route = createFileRoute("/invoice/$id")({
  head: () => ({ meta: [{ title: "Listing · Paidline" }] }),
  component: SellerInvoice,
});

function SellerInvoice() {
  const { id } = Route.useParams();
  const invoiceId = Number(id);
  const address = useSession((s) => s.address);
  const [invoice, setInvoice] = useState<InvoiceWire | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void getInvoice({ data: { id: invoiceId } }).then(setInvoice);
  }, [invoiceId]);

  useEffect(() => {
    if (!invoice || (invoice.status !== "unpaid" && invoice.status !== "expired")) return;
    const t = window.setInterval(() => {
      void getInvoice({ data: { id: invoiceId } }).then(setInvoice);
    }, 8_000);
    return () => window.clearInterval(t);
  }, [invoice, invoiceId]);

  if (invoice === undefined) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <SheetSkeleton />
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-3xl">Invoice not found</h1>
        <p className="mt-2 text-sm text-muted">Nothing at this number.</p>
        <Link to="/invoices" className="mt-6 inline-block text-sm underline underline-offset-4">
          Back to listings
        </Link>
      </main>
    );
  }

  const live = invoice;
  const isMerchant = Boolean(address && address.toLowerCase() === live.merchant.toLowerCase());

  async function onCopy() {
    const ok = await copyText(`${window.location.origin}/pay/${live.id}`);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  async function onCancel() {
    if (!hasWallet()) {
      setErr("Connect the merchant wallet.");
      return;
    }
    try {
      await cancelOnchain(live.id);
      const next = await getInvoice({ data: { id: live.id } });
      setInvoice(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Cancel failed.");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="mb-4 text-xs uppercase tracking-wide text-muted">
        <Link to="/invoices" className="hover:text-fg">
          Listings
        </Link>
        <span className="mx-2 text-faint">/</span>
        Listing #{invoice.id}
      </p>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <InvoiceSheet className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">Listing #{invoice.id}</p>
              <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">{invoice.title}</h1>
            </div>
            <StatusPill status={invoice.status} />
          </div>

          <dl className="mt-8 grid gap-5">
            <SheetMeta label="Amount due">
              <span className="font-display text-4xl tabular-nums tracking-tight">
                {formatUnits(BigInt(invoice.sourceAmount), SOURCE_DECIMALS)} USDC
              </span>
            </SheetMeta>
            <SheetMeta label="Buyer receives">{invoice.releaseLabel}</SheetMeta>
            <SheetMeta label="Pay to">
              <span className="break-all font-mono text-xs">{invoice.sourceRecipient}</span>
            </SheetMeta>
            {invoice.status === "unpaid" || invoice.status === "expired" ? (
              <SheetMeta label="Due">{formatDue(invoice.expiry)}</SheetMeta>
            ) : null}
            {invoice.funded && BigInt(invoice.localAmount) > 0n ? (
              <SheetMeta label="Locked">
                {formatUnits(BigInt(invoice.localAmount), LOCAL_DECIMALS)} tCTC · releases to the payer
              </SheetMeta>
            ) : null}
            {invoice.status === "paid" && invoice.paidTxHash ? (
              <SheetMeta label="Ethereum payment">
                <a
                  className="font-mono text-xs underline underline-offset-4"
                  href={`${SEPOLIA_EXPLORER}/tx/${invoice.paidTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortAddr(invoice.paidTxHash, 8)}
                </a>
              </SheetMeta>
            ) : null}
          </dl>
        </InvoiceSheet>
        <aside className="rounded-xl border border-line bg-surface p-5">
          <p className="kicker">Share</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Send the payment link. The buyer does not need a Creditcoin wallet. They send exact USDC
            on Ethereum Sepolia.
          </p>
          <p className="mt-4 font-mono text-xs text-faint">
            Merchant {shortAddr(invoice.merchant, 4)}
          </p>
        </aside>
      </div>

      {invoice.status === "paid" ? (
        <div className="mt-6">
          <p className="flex items-center gap-2 text-sm text-paid">
            <Check className="size-4" strokeWidth={2} />
            Paid. {invoice.releaseLabel} released. No one in the middle confirmed this.
          </p>
          <Link
            to="/receipt/$id"
            params={{ id: String(invoice.id) }}
            className="mt-3 inline-block text-sm underline decoration-line underline-offset-4"
          >
            Open the receipt
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => void onCopy()}>
            {copied ? "Link copied" : "Copy payment link"}
            <Copy className="size-4" strokeWidth={1.75} />
          </Button>
          <Link to="/pay/$id" params={{ id: String(invoice.id) }}>
            <Button variant="ghost">Open payment page</Button>
          </Link>
          {isMerchant && invoice.status === "unpaid" ? (
            <Button variant="danger" onClick={() => void onCancel()}>
              Cancel
            </Button>
          ) : null}
        </div>
      )}
      {err ? <p className="mt-4 text-sm text-bad">{err}</p> : null}
      <p className="mt-6 text-xs text-faint">
        <a
          className="underline underline-offset-4"
          href={`${CREDITCOIN_EXPLORER}/address/${invoice.merchant}`}
          target="_blank"
          rel="noreferrer"
        >
          Merchant on Creditcoin
        </a>
      </p>
    </main>
  );
}
