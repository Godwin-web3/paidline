import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export const Route = createFileRoute("/gate/")({
  head: () => ({ meta: [{ title: "API · Paidline" }] }),
  component: GateLookup,
});

function GateLookup() {
  const navigate = useNavigate();
  const [id, setId] = useState("1");
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
      <p className="kicker">API</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">Pay, then get the resource</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        An agent or app calls this endpoint. Unpaid listings return HTTP 402 with a checkout link.
        After the contract stamps payment, the same call returns 200.
      </p>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-xl border border-line bg-surface p-5">
        <Field label="Invoice number" hint="Try a live listing from the marketplace.">
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
      <div className="mt-4 flex flex-wrap gap-2">
        {["1", "3", "5"].map((n) => (
          <Link
            key={n}
            to="/gate/$id"
            params={{ id: n }}
            className="inline-flex min-h-9 items-center rounded-full border border-line px-3 text-xs text-muted hover:border-line-strong hover:text-fg"
          >
            Try #{n}
          </Link>
        ))}
      </div>
      <p className="mt-6 font-mono text-xs text-faint">GET /api/gate/{"{id}"}</p>
    </main>
  );
}
