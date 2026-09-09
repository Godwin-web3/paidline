import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export const Route = createFileRoute("/gate/")({ component: GateLookup });

function GateLookup() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(id.trim());
    if (!Number.isInteger(n) || n < 1) {
      setError("Enter an invoice number.");
      return;
    }
    void navigate({ to: "/gate/$id", params: { id: String(n) } });
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs uppercase tracking-wide text-muted">API</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">Pay, then get the resource</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        An agent or app calls this endpoint. If the listing is unpaid, the response is HTTP 402
        with a checkout link. After payment is confirmed, the same call returns 200.
      </p>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-xl border border-line bg-surface p-5">
        <Field label="Invoice number">
          <Input
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setError(null);
            }}
            inputMode="numeric"
            placeholder="1"
            aria-label="Invoice number"
          />
        </Field>
        {error ? <p className="text-sm text-bad">{error}</p> : null}
        <Button type="submit" size="lg">
          Check listing
        </Button>
      </form>
      <p className="mt-4 font-mono text-xs text-faint">GET /api/gate/{"{id}"}</p>
    </main>
  );
}
