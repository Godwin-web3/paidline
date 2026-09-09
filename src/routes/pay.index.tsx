import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OpenBoard } from "@/components/open-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceSheet } from "@/components/invoice-sheet";

export const Route = createFileRoute("/pay/")({ component: PayLookup });

function PayLookup() {
  const navigate = useNavigate();
  const [lookup, setLookup] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = Number(lookup.trim());
    if (!Number.isInteger(id) || id < 1) {
      setError("Enter a listing number.");
      return;
    }
    void navigate({ to: "/pay/$id", params: { id: String(id) } });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs uppercase tracking-wide text-muted">Marketplace</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">Open listings</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Public board. First matching USDC payment claims the listing.
      </p>

      <div className="mt-8">
        <OpenBoard />
      </div>

      <InvoiceSheet className="mt-10 max-w-lg p-6 sm:p-8">
        <p className="text-xs uppercase tracking-wide text-ink-muted">Have a number?</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">Pay by number</h2>
        <form onSubmit={onLookup} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1.5">
            <span className="text-xs uppercase tracking-wide text-ink-muted">Invoice</span>
            <Input
              value={lookup}
              onChange={(e) => {
                setLookup(e.target.value);
                setError(null);
              }}
              inputMode="numeric"
              placeholder="4"
              aria-label="Invoice number"
              className="border-rule bg-paper text-ink placeholder:text-ink-muted"
            />
          </label>
          <Button type="submit" size="lg" variant="ink">
            Pay
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
      </InvoiceSheet>
    </main>
  );
}
