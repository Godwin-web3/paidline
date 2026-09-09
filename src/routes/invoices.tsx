import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PaperSlip } from "@/components/paper-slip";
import { SettlementPath, type DeskPhase } from "@/components/settlement-path";
import { StatusStrip } from "@/components/status-strip";
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

  const pendingList = invoices?.filter((i) => i.status === "unpaid") ?? [];
  const pending = pendingList.length;
  const paid = invoices?.filter((i) => i.status === "paid").length ?? 0;
  const phase: DeskPhase = !address
    ? "connect"
    : !invoices || invoices.length === 0
      ? "issue"
      : pending > 0
        ? "pay"
        : "done";

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
          <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">Settlement</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
            Issue on Creditcoin. Collect USDC on Ethereum. The contract stamps it.
          </p>
        </div>
        {address ? (
          <Link to="/new">
            <Button>
              <Plus className="size-4" strokeWidth={1.75} />
              Issue invoice
            </Button>
          </Link>
        ) : (
          <Button onClick={() => void connect()}>Connect wallet</Button>
        )}
      </div>

      <div className="mt-8">
        <StatusStrip address={address} />
      </div>
      <div className="mt-4">
        <SettlementPath phase={phase} pendingId={pendingList[0]?.id} />
      </div>

      {error ? <p className="mt-6 text-sm text-bad">{error}</p> : null}
      {loadError ? <p className="mt-6 text-sm text-bad">{loadError}</p> : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
        <section>
          <p className="mb-4 text-xs uppercase tracking-wide text-muted">
            {address && invoices && invoices.length > 0
              ? `${pending} pending · ${paid} paid`
              : "Blotter"}
          </p>
          {!ready ? (
            <p className="text-sm text-muted">Reading the desk…</p>
          ) : !address ? (
            <DisconnectedDesk onConnect={() => void connect()} />
          ) : invoices === null && !loadError ? (
            <p className="text-sm text-muted">Reading invoices…</p>
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

        <aside className="grid gap-4 self-start">
          <figure className="overflow-hidden rounded-xl">
            <img
              src="/brand/hallmark.jpg"
              alt="Steel hallmark stamp"
              className="aspect-square w-full object-cover"
            />
          </figure>
          <form onSubmit={onLookup} className="rounded-xl border border-line bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Step 02</p>
            <p className="mt-2 font-display text-2xl tracking-tight">Pay by number</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Buyer opens the sheet. Sends the exact USDC. This page watches.
            </p>
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
            <p className="text-xs uppercase tracking-wide text-muted">Before you begin</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Creditcoin CC3 testnet. USDC on Ethereum Sepolia. You stay in control of the wallet.
              The contract, not this site, decides paid.
            </p>
            <Link to="/docs" className="mt-3 inline-block text-sm underline decoration-line underline-offset-4">
              Source and contract
            </Link>
            <p className="mt-3 break-all font-mono text-xs text-faint">
              <a
                href={`${CREDITCOIN_EXPLORER}/address/${PAIDLINE_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
              >
                {shortAddr(PAIDLINE_ADDRESS, 6)}
              </a>
            </p>
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
        <p className="font-display text-2xl tracking-tight">Connect the issuing wallet</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          Specimens above so the desk is not empty. Your blotter is on Creditcoin, keyed to the
          wallet that issued the invoices. Start at step 01.
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
    <div className="relative overflow-hidden rounded-xl bg-paper p-6 text-ink shadow-sheet sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-45 mix-blend-multiply paper-tooth" />
      <div aria-hidden className="pointer-events-none absolute inset-0 sheet-rules opacity-70" />
      <div className="relative">
        <p className="text-xs uppercase tracking-wide text-ink-muted">Step 01</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-ink">Issue the first invoice</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
          Name the work. Set the USDC. Lock Creditcoin. You get a number and a pay link. Then this
          blotter has paper on it.
        </p>
        <Link to="/new" className="mt-6 inline-block">
          <Button variant="ink">Write the invoice</Button>
        </Link>
      </div>
    </div>
  );
}
