import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PaperSlip } from "@/components/paper-slip";
import { BoardSkeleton } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { listInvoices } from "@/lib/paidline/invoices";
import { useSession } from "@/lib/paidline/session";
import type { InvoiceWire } from "@/lib/paidline/types";
import { formatDue, formatUnits, shortAddr } from "@/lib/utils";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Your listings · Paidline" }] }),
  component: Invoices,
});

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
      .catch((e: unknown) =>
        setLoadError(e instanceof Error ? e.message : "Could not load listings."),
      );
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Your listings"
        action={
          address ? (
            <Link to="/new">
              <Button>
                <Plus className="size-4" strokeWidth={1.75} />
                New listing
              </Button>
            </Link>
          ) : (
            <Button onClick={() => void connect()}>Connect wallet</Button>
          )
        }
      >
        What you published. Open ones sit on the marketplace until someone pays. Work stays sealed
        until the contract says paid.
      </PageHeader>

      {error ? <p className="mt-6 text-sm text-bad">{error}</p> : null}
      {loadError ? <p className="mt-6 text-sm text-bad">{loadError}</p> : null}

      <section className="mt-8">
        {address && invoices && invoices.length > 0 ? (
          <p className="mb-4 text-xs uppercase tracking-wide text-muted">
            {pending} open · {paid} paid
          </p>
        ) : null}
        {!ready ? (
          <BoardSkeleton rows={4} />
        ) : !address ? (
          <DisconnectedDesk onConnect={() => void connect()} />
        ) : invoices === null && !loadError ? (
          <BoardSkeleton rows={4} />
        ) : invoices && invoices.length === 0 ? (
          <EmptyDesk />
        ) : invoices ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <PaperSlip
                  id={String(inv.id)}
                  title={inv.title}
                  amount={formatUnits(BigInt(inv.sourceAmount), SOURCE_DECIMALS)}
                  status={inv.status}
                  to="/invoice/$id"
                  meta={
                    inv.status === "paid" && inv.paidTxHash
                      ? shortAddr(inv.paidTxHash, 6)
                      : inv.status === "unpaid" || inv.status === "expired"
                        ? formatDue(inv.expiry)
                        : inv.releaseLabel
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

function DisconnectedDesk({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
      <p className="kicker">Wallet</p>
      <p className="mt-2 font-display text-2xl tracking-tight">Connect to see your listings</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        Listings are tied to the Creditcoin wallet that published them. Looking at the marketplace
        does not require a wallet.
      </p>
      <Button className="mt-5" onClick={onConnect}>
        Connect wallet
      </Button>
    </div>
  );
}

function EmptyDesk() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-paper p-6 text-ink shadow-sheet sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-45 mix-blend-multiply paper-tooth" />
      <div className="relative">
        <h2 className="font-display text-3xl tracking-tight text-ink">Nothing published yet</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
          Name the work, attach it, set a price, lock a little credit. It goes live on the marketplace.
        </p>
        <Link to="/new" className="mt-6 inline-block">
          <Button variant="ink">New listing</Button>
        </Link>
      </div>
    </div>
  );
}
