import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

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
    <main className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs uppercase tracking-wide text-muted">Pay</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight">Open an invoice</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Use the number the seller sent. You will send USDC on Ethereum. This page watches for the
        exact transfer. The contract is what marks it paid.
      </p>
      <form
        onSubmit={onLookup}
        className="mt-8 grid gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6"
      >
        <Field label="Invoice number">
          <Input
            value={lookup}
            onChange={(e) => {
              setLookup(e.target.value);
              setError(null);
            }}
            inputMode="numeric"
            placeholder="4821"
            aria-label="Invoice number"
          />
        </Field>
        {error ? <p className="text-sm text-bad">{error}</p> : null}
        <Button type="submit" size="lg">
          Open invoice
        </Button>
      </form>
    </main>
  );
}
