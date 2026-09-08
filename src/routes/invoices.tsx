import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PaperSlip } from "@/components/paper-slip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CREDITCOIN_EXPLORER,
  PAIDLINE_ADDRESS,
  SOURCE_DECIMALS,
} from "@/lib/paidline/constants";
import { listInvoices } from "@/lib/paidline/invoices";
import { useSession } from "@/lib/paidline/session";
import type { InvoiceWire } from "@/lib/paidline/types";
import { formatDue, formatUnits, shortAddr } from "@/lib/utils";

export const Route = createFileRoute("/invoices")({ component: Invoices });

function Invoices() {
  const navigate = useNavigate();
  const address = useSession((s) => s.address);
  const ready = useSession((s) => s.ready);
  const connect = useSession((s) => s.connect);
  const error = useSession((s) => s.error);
  const [invoices, setInvoices] = useState<InvoiceWire[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lookup, setLookup] = useState("");

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

  function onLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = Number(lookup.trim());
    if (!Number.isInteger(id) || id < 1) return;
    void navigate({ to: "/pay/$id", params: { id: String(id) } });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Desk</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">The blotter</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            {address
              ? `Invoices issued by ${shortAddr(address, 4)}. Pending until the contract matches a USDC transfer.`
              : "Connect the Creditcoin wallet you issue from. The list is on-chain. This desk is yours."}
          </p>
        </div>
        <Link to="/new">
          <Button>
            <Plus className="size-4" strokeWidth={1.75} />
            Issue invoice
          </Button>
        </Link>
      </div>

      {error ? <p className="mt-6 text-sm text-bad">{error}</p> : null}
      {loadError ? <p className="mt-6 text-sm text-bad">{loadError}</p> : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
        <section>
          {!ready ? (
            <p className="text-sm text-muted">Reading the desk…</p>
          ) : !address ? (
            <DisconnectedDesk onConnect={() => void connect()} />
          ) : invoices === null && !loadError ? (
            <p className="text-sm text-muted">Reading invoices…</p>
          ) : invoices && invoices.length === 0 ? (
            <EmptyDesk />
          ) : invoices ? (
            <>
              <p className="mb-4 text-xs uppercase tracking-wide text-muted">
                {pending} pending · {paid} paid
              </p>
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
            </>
          ) : null}
        </section>

        <aside className="grid gap-4 self-start">
          <figure className="overflow-hidden rounded-xl">
            <img
              src="/brand/hallmark.jpg"
              alt="Steel hallmark stamp"
              className="aspect-square w-full object-cover"
            />
          </figure>
          <form
            onSubmit={onLookup}
            className="rounded-xl border border-line bg-surface p-5"
          >
            <p className="text-xs uppercase tracking-wide text-muted">Open a payment</p>
            <p className="mt-2 font-display text-2xl tracking-tight">Have a number?</p>
            <div className="mt-4 flex gap-2">
              <Input
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                inputMode="numeric"
                placeholder="4821"
                aria-label="Invoice number"
              />
              <Button type="submit" variant="ghost">
                Pay
              </Button>
            </div>
          </form>
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Checker</p>
            <p className="mt-2 font-display text-2xl tracking-tight">The contract</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              isPaid. InvoicePaid. Nothing else is allowed to mark an invoice settled.
            </p>
            <a
              className="mt-3 inline-block break-all font-mono text-xs text-faint underline underline-offset-4"
              href={`${CREDITCOIN_EXPLORER}/address/${PAIDLINE_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              {shortAddr(PAIDLINE_ADDRESS, 6)}
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}

function DisconnectedDesk({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <PaperSlip
          specimen
          id="—"
          title="September retainer"
          amount="250.00"
          status="paid"
          meta="Checked. Ethereum hash on the row."
        />
        <PaperSlip
          specimen
          id="—"
          title="Design pass"
          amount="80.00"
          status="unpaid"
          meta="Waiting on the exact USDC transfer."
        />
      </div>
      <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <p className="font-display text-2xl tracking-tight">Connect to see your blotter</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          Specimens above. Your invoices live on Creditcoin, keyed to the wallet that issued them.
          Pending becomes paid only after the contract matches the transfer.
        </p>
        <Button className="mt-5" onClick={onConnect}>
          Connect wallet
        </Button>
      </div>
    </div>
  );
}

function EmptyDesk() {
  return (
    <InvoiceBlank>
      <p className="text-xs uppercase tracking-wide text-ink-muted">Blotter</p>
      <h2 className="mt-2 font-display text-3xl tracking-tight text-ink">No invoices yet</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
        Issue one. Lock Creditcoin. Send the pay link. This desk fills with paper as they land, and
        the stamp moves when the USDC is checked.
      </p>
      <Link to="/new" className="mt-6 inline-block">
        <Button variant="ink">Issue the first invoice</Button>
      </Link>
    </InvoiceBlank>
  );
}

function InvoiceBlank({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-paper p-6 text-ink shadow-sheet sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-45 mix-blend-multiply paper-tooth" />
      <div aria-hidden className="pointer-events-none absolute inset-0 sheet-rules opacity-70" />
      <div className="relative">{children}</div>
    </div>
  );
}
