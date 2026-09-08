import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { LOCAL_DECIMALS, SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { useSession } from "@/lib/paidline/session";
import { createOnchainInvoice, hasWallet } from "@/lib/paidline/wallet";
import { parseUnits, shortAddr } from "@/lib/utils";

export const Route = createFileRoute("/new")({ component: NewInvoice });

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

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Issue</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">New invoice</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        This writes to Creditcoin. The buyer pays USDC on Ethereum to{" "}
        {address ? (
          <span className="font-mono text-fg">{shortAddr(address, 4)}</span>
        ) : (
          "the connected wallet"
        )}
        . Creditcoin you lock is released to whoever paid.
      </p>

      <form onSubmit={(e) => void onCreate(e)} className="mt-8 grid gap-5">
        <Field label="What you are selling">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-sans"
            placeholder="September retainer"
            autoComplete="off"
          />
        </Field>
        <Field
          label="Price in USDC"
          hint="Buyer sends this exact amount on Ethereum. You cannot have two open invoices for the same amount to this wallet."
        >
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="250.00"
          />
        </Field>
        <Field label="What they receive">
          <Input
            value={releaseLabel}
            onChange={(e) => setReleaseLabel(e.target.value)}
            className="font-sans"
            placeholder="Delivery of the work"
            autoComplete="off"
          />
        </Field>
        <Field
          label="Creditcoin to lock"
          hint="Released to the paying wallet when the USDC transfer is confirmed."
        >
          <Input
            value={escrow}
            onChange={(e) => setEscrow(e.target.value)}
            inputMode="decimal"
            placeholder="0.01"
          />
        </Field>
        <Field label="Due">
          <div className="flex flex-wrap gap-2">
            {DUE_OPTIONS.map((opt) => (
              <button
                key={opt.hours}
                type="button"
                onClick={() => setHours(opt.hours)}
                className={
                  hours === opt.hours
                    ? "h-11 rounded-[12px] bg-accent px-4 text-sm text-accent-fg"
                    : "h-11 rounded-[12px] border border-line px-4 text-sm text-muted hover:text-fg"
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
        {error ? <p className="text-sm text-bad">{error}</p> : null}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Waiting on wallet…" : "Issue invoice"}
        </Button>
        <p className="text-center text-xs text-faint">
          <Link to="/invoices" className="underline decoration-line underline-offset-4">
            Back to invoices
          </Link>
        </p>
      </form>
    </main>
  );
}
