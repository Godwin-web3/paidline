import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { listInvoices } from "@/lib/paidline/invoices";
import { useSession } from "@/lib/paidline/session";
import type { InvoiceWire } from "@/lib/paidline/types";
import { formatDue, formatUnits, shortAddr } from "@/lib/utils";

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

  const pending = invoices?.filter((i) => i.status === "unpaid").length ?? 0;
  const paid = invoices?.filter((i) => i.status === "paid").length ?? 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">Invoices</h1>
          {invoices && invoices.length > 0 ? (
            <p className="mt-1 text-sm text-muted">
              {pending} pending · {paid} paid
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Issued from the connected wallet.</p>
          )}
        </div>
        {address ? (
          <Link to="/new">
            <Button>
              <Plus className="size-4" strokeWidth={1.75} />
              Create invoice
            </Button>
          </Link>
        ) : null}
      </div>

      {error ? <p className="mt-6 text-sm text-bad">{error}</p> : null}
      {loadError ? <p className="mt-6 text-sm text-bad">{loadError}</p> : null}

      {!ready ? (
        <p className="mt-10 text-sm text-muted">Loading…</p>
      ) : !address ? (
        <EmptyPanel
          title="Connect the wallet you issue from"
          body="This list is yours. Invoices live on Creditcoin, keyed to the connected address."
        >
          <Button onClick={() => void connect()}>Connect wallet</Button>
        </EmptyPanel>
      ) : invoices === null && !loadError ? (
        <p className="mt-10 text-sm text-muted">Reading invoices…</p>
      ) : invoices && invoices.length === 0 ? (
        <EmptyPanel
          title="No invoices yet"
          body="Create one. Lock Creditcoin. Send the payment link. This list moves from pending to paid when the USDC is checked."
        >
          <Link to="/new">
            <Button>Create invoice</Button>
          </Link>
        </EmptyPanel>
      ) : invoices ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-line bg-surface">
          <div className="hidden grid-cols-[1fr_7rem_7rem] gap-4 border-b border-line px-4 py-2.5 text-[11px] uppercase tracking-wide text-muted sm:grid">
            <span>Invoice</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Status</span>
          </div>
          <ul>
            {invoices.map((inv) => (
              <li key={inv.id} className="border-b border-line last:border-b-0">
                <Link
                  to="/invoice/$id"
                  params={{ id: String(inv.id) }}
                  className="grid gap-1 px-4 py-3.5 transition-colors duration-150 hover:bg-raised sm:grid-cols-[1fr_7rem_7rem] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <span className="font-mono text-xs text-muted">#{inv.id}</span>
                      <span className="ml-2 font-medium">{inv.title}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {inv.status === "paid" && inv.paidTxHash ? (
                        <span className="font-mono">{shortAddr(inv.paidTxHash, 6)}</span>
                      ) : inv.status === "unpaid" || inv.status === "expired" ? (
                        formatDue(inv.expiry)
                      ) : (
                        inv.releaseLabel
                      )}
                    </p>
                  </div>
                  <p className="font-mono text-sm tabular-nums sm:text-right">
                    {formatUnits(BigInt(inv.sourceAmount), SOURCE_DECIMALS)} USDC
                  </p>
                  <div className="sm:justify-self-end">
                    <StatusPill status={inv.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
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
    <div className="mt-8 rounded-lg border border-line bg-surface px-5 py-8">
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">{body}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}
