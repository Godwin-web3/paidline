import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { InvoiceSheet, SheetMeta } from "@/components/invoice-sheet";
import { LOCAL_DECIMALS, SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { useSession } from "@/lib/paidline/session";
import { createOnchainInvoice, hasWallet } from "@/lib/paidline/wallet";
import { parseUnits, shortAddr } from "@/lib/utils";

export const Route = createFileRoute("/new")({
  head: () => ({ meta: [{ title: "New listing · Paidline" }] }),
  component: NewInvoice,
});

const DUE_OPTIONS = [
  { hours: 24, label: "1 day" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
  { hours: 720, label: "30 days" },
] as const;

function NewInvoice() {
  const navigate = useNavigate();
  const address = useSession((s) => s.address);
  const connect = useSession((s) => s.connect);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [releaseLabel, setReleaseLabel] = useState("");
  const [escrow, setEscrow] = useState("");
  const [hours, setHours] = useState(168);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Name the work and set a price.");
      return;
    }
    if (!/^\d+(\.\d+)?$/.test(price.trim()) || !/^\d+(\.\d+)?$/.test(escrow.trim())) {
      setError("Use a number for the price and the locked amount.");
      return;
    }
    const sourceAmount = parseUnits(price, SOURCE_DECIMALS);
    const lock = parseUnits(escrow, LOCAL_DECIMALS);
    if (sourceAmount <= 0n) {
      setError("Name the work and set a price.");
      return;
    }
    if (lock <= 0n) {
      setError("Lock some Creditcoin. That is what releases to the payer.");
      return;
    }
    if (!hasWallet()) {
      setError("Connect a wallet on Creditcoin.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const account = address ?? (await connect());
      if (!account) {
        setError("Connect a wallet on Creditcoin.");
        setBusy(false);
        return;
      }
      const id = await createOnchainInvoice({
        title: title.trim(),
        releaseLabel: releaseLabel.trim() || "Paid",
        sourceRecipient: account,
        sourceAmount,
        escrowTctc: escrow.trim(),
        hours,
      });
      if (!id) throw new Error("Invoice created but the id was missing from the receipt.");
      await navigate({ to: "/invoice/$id", params: { id: String(id) } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The wallet or network refused the transaction.");
    }
    setBusy(false);
  }

  const dueLabel = DUE_OPTIONS.find((o) => o.hours === hours)?.label ?? "7 days";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="kicker">New listing</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">Create a listing</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Name the work, the exact USDC price, and the Creditcoin you lock. It goes public as soon as
        the transaction confirms. First matching payment claims it.
        {address ? (
          <>
            {" "}
            USDC lands at <span className="font-mono text-fg">{shortAddr(address, 4)}</span>.
          </>
        ) : (
          <> Connect a Creditcoin wallet to set the destination and publish.</>
        )}
      </p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
        <InvoiceSheet className="p-6 sm:p-8">
          <form onSubmit={(e) => void onCreate(e)} className="grid gap-5">
            <Field label="Title" paper>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-rule bg-paper font-sans text-ink placeholder:text-ink-muted"
                placeholder="September retainer"
                autoComplete="off"
              />
            </Field>
            <Field
              paper
              label="Price in USDC"
              hint="The buyer must send this exact amount. You cannot have two open listings at the same price to this wallet."
            >
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="250.00"
                className="border-rule bg-paper text-ink placeholder:text-ink-muted"
              />
            </Field>
            <Field label="What the buyer gets" paper>
              <Input
                value={releaseLabel}
                onChange={(e) => setReleaseLabel(e.target.value)}
                className="border-rule bg-paper font-sans text-ink placeholder:text-ink-muted"
                placeholder="Delivery of the work"
                autoComplete="off"
              />
            </Field>
            <Field
              paper
              label="Credit to lock"
              hint="Released to the buyer when payment is confirmed."
            >
              <Input
                value={escrow}
                onChange={(e) => setEscrow(e.target.value)}
                inputMode="decimal"
                placeholder="0.01"
                className="border-rule bg-paper text-ink placeholder:text-ink-muted"
              />
            </Field>
            <Field label="Due" paper>
              <div className="flex flex-wrap gap-2">
                {DUE_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setHours(opt.hours)}
                    className={
                      hours === opt.hours
                        ? "h-11 rounded-md bg-ink px-4 text-sm text-paper"
                        : "h-11 rounded-md border border-rule px-4 text-sm text-ink-muted hover:text-ink"
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
            {error ? <p className="text-sm text-bad">{error}</p> : null}
            <Button type="submit" size="lg" variant="ink" disabled={busy}>
              {busy ? "Confirm in wallet…" : "Publish listing"}
            </Button>
          </form>
        </InvoiceSheet>

        <div className="lg:sticky lg:top-8">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted">Buyer preview</p>
          <InvoiceSheet className="p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Listing</p>
            <h2 className="mt-2 font-display text-4xl tracking-tight text-ink">
              {title.trim() || "Untitled work"}
            </h2>
            <dl className="mt-8 grid gap-5">
              <SheetMeta label="Amount due">
                <span className="font-display text-5xl tabular-nums tracking-tight">
                  {price.trim() || "0.00"}
                  <span className="ml-2 text-xl text-ink-muted">USDC</span>
                </span>
              </SheetMeta>
              <SheetMeta label="You receive">{releaseLabel.trim() || "—"}</SheetMeta>
              <SheetMeta label="Pay to">
                <span className="font-mono text-xs">
                  {address ? shortAddr(address, 6) : "Connect to set destination"}
                </span>
              </SheetMeta>
              <SheetMeta label="Due">{dueLabel}</SheetMeta>
              <SheetMeta label="Locked">
                {escrow.trim() ? `${escrow.trim()} tCTC` : "—"}
              </SheetMeta>
            </dl>
          </InvoiceSheet>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-faint">
        <Link to="/invoices" className="underline decoration-line underline-offset-4">
          Back to listings
        </Link>
      </p>
    </main>
  );
}
