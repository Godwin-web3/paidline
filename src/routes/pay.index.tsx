import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
      setError("Enter the invoice number from the payment link.");
      return;
    }
    void navigate({ to: "/pay/$id", params: { id: String(id) } });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs uppercase tracking-wide text-muted">Pay</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">Open the invoice</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Use the number the seller sent. You send USDC on Ethereum. This page watches for the exact
        transfer. The contract is what marks it paid.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <figure className="overflow-hidden rounded-xl">
          <img
            src="/brand/specimen.jpg"
            alt="An invoice sheet with a pressed circular seal on walnut"
            className="h-full min-h-72 w-full object-cover"
          />
        </figure>
        <InvoiceSheet className="flex flex-col justify-between p-6 sm:p-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Have a payment link?</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight">Enter the number</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
              Same sheet the seller issued. Amount, destination, and what you receive are already
              written.
            </p>
          </div>
          <form onSubmit={onLookup} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid flex-1 gap-1.5">
              <span className="text-xs uppercase tracking-wide text-ink-muted">Invoice</span>
              <Input
                value={lookup}
                onChange={(e) => {
                  setLookup(e.target.value);
                  setError(null);
                }}
                inputMode="numeric"
                placeholder="4821"
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
      </div>
    </main>
  );
}
