import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { InvoiceSheet } from "@/components/invoice-sheet";
import { SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { listInvoices } from "@/lib/paidline/invoices";
import { useSession } from "@/lib/paidline/session";
import type { InvoiceWire } from "@/lib/paidline/types";
import { formatDue, formatUnits } from "@/lib/utils";

export const Route = createFileRoute("/invoices")({ component: Invoices });

function Invoices() {
  const address = useSession((s) => s.address);
  const ready = useSession((s) => s.ready);
  const connect = useSession((s) => s.connect);
  const error = useSession((s) => s.error);
  const [invoices, setInvoices] = useState<InvoiceWire[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setInvoices(null);
      return;
    }
    setInvoices(null);
    setLoadError(null);
    void listInvoices({ data: { merchant: address } })
      .then(setInvoices)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Could not read invoices."));
  }, [address]);

  useEffect(() => {
    if (!address) return;
    const t = window.setInterval(() => {
      void listInvoices({ data: { merchant: address } }).then(setInvoices).catch(() => {});
    }, 10_000);
    return () => window.clearInterval(t);
  }, [address]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Invoices</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Issued from the connected wallet. Share the payment link. The invoice updates when the
            USDC transfer is confirmed.
          </p>
        </div>
        {address ? (
          <Link to="/new">
            <Button>
              <Plus className="size-4" strokeWidth={1.75} />
              New invoice
            </Button>
          </Link>
        ) : null}
      </div>

      {error ? <p className="mt-8 text-sm text-bad">{error}</p> : null}
      {loadError ? <p className="mt-8 text-sm text-bad">{loadError}</p> : null}

      {!ready ? (
        <p className="mt-12 text-sm text-muted">Loading…</p>
      ) : !address ? (
        <EmptyPanel
          title="Connect the wallet you issue from"
          body="Invoices live on Creditcoin. This list is yours, not a shared board."
        >
          <Button onClick={() => void connect()}>Connect wallet</Button>
        </EmptyPanel>
      ) : invoices === null && !loadError ? (
        <p className="mt-12 text-sm text-muted">Reading your invoices…</p>
      ) : invoices && invoices.length === 0 ? (
        <EmptyPanel
          title="No invoices yet"
          body="Issue one. You get a payment link. The buyer sends USDC. This page updates when it clears."
        >
          <Link to="/new">
            <Button>Issue invoice</Button>
          </Link>
        </EmptyPanel>
      ) : invoices ? (
        <ul className="mt-10 grid gap-3">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <Link to="/invoice/$id" params={{ id: String(inv.id) }}>
                <InvoiceSheet className="px-5 py-4 transition-transform duration-150 ease-out hover:-translate-y-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl tracking-tight text-ink">
                        #{inv.id}
                        <span className="ml-2 font-sans text-sm font-medium">{inv.title}</span>
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {formatUnits(BigInt(inv.sourceAmount), SOURCE_DECIMALS)} USDC
                        {inv.status === "unpaid" || inv.status === "expired"
                          ? ` · ${formatDue(inv.expiry)}`
                          : ""}
                      </p>
                    </div>
                    <span className="flex items-center gap-3">
                      <StatusPill status={inv.status} />
                      <ArrowRight className="size-4 text-ink-muted" strokeWidth={1.5} />
                    </span>
                  </div>
                </InvoiceSheet>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}

function EmptyPanel({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-12 overflow-hidden rounded-2xl border border-line bg-surface">
      <img
        src="/brand/specimen.jpg"
        alt=""
        className="h-40 w-full object-cover opacity-80"
      />
      <div className="px-6 py-10 text-center">
        <p className="font-display text-3xl tracking-tight">{title}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
