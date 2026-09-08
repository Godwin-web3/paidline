import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
        <div className="mt-12 rounded-[28px] border border-line bg-surface px-6 py-14 text-center">
          <p className="font-display text-2xl tracking-tight">Connect the wallet you issue from</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Invoices live on Creditcoin. This list is yours, not a shared board.
          </p>
          <div className="mt-6">
            <Button onClick={() => void connect()}>Connect wallet</Button>
          </div>
        </div>
      ) : invoices === null && !loadError ? (
        <p className="mt-12 text-sm text-muted">Reading your invoices…</p>
      ) : invoices && invoices.length === 0 ? (
        <div className="mt-12 rounded-[28px] border border-line bg-surface px-6 py-14 text-center">
          <p className="font-display text-2xl tracking-tight">No invoices yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Issue one. You get a payment link. The buyer sends USDC. This page updates when it
            clears.
          </p>
          <div className="mt-6">
            <Link to="/new">
              <Button>Issue invoice</Button>
            </Link>
          </div>
        </div>
      ) : invoices ? (
        <ul className="mt-10 divide-y divide-line rounded-[28px] border border-line bg-surface">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <Link
                to="/invoice/$id"
                params={{ id: String(inv.id) }}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-150 hover:bg-raised"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    #{inv.id} · {inv.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">
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
