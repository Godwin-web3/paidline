import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Workspace</p>
          <h1 className="mt-1 font-display text-2xl tracking-tight sm:text-3xl">Invoices</h1>
        </div>
        {address ? (
          <Link to="/new">
            <Button>
              <Plus className="size-4" strokeWidth={1.75} />
              New
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
          body="Issue one. Share the payment link. This list updates when the USDC clears."
        >
          <Link to="/new">
            <Button>Issue invoice</Button>
          </Link>
        </EmptyPanel>
      ) : invoices ? (
        <ul className="mt-8 overflow-hidden rounded-lg border border-line bg-surface">
          {invoices.map((inv) => (
            <li key={inv.id} className="border-b border-line last:border-b-0">
              <Link
                to="/invoice/$id"
                params={{ id: String(inv.id) }}
                className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-raised"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    <span className="font-mono text-xs text-muted">#{inv.id}</span>
                    <span className="ml-2 font-medium">{inv.title}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {formatUnits(BigInt(inv.sourceAmount), SOURCE_DECIMALS)} USDC
                    {inv.status === "unpaid" || inv.status === "expired"
                      ? ` · ${formatDue(inv.expiry)}`
                      : ""}
                  </p>
                </div>
                <span className="flex items-center gap-3">
                  <StatusPill status={inv.status} />
                  <ArrowRight className="size-4 text-faint" strokeWidth={1.5} />
                </span>
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
    <div className="mt-8 rounded-lg border border-line bg-surface px-5 py-8">
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">{body}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}
