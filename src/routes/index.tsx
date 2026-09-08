import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const [lookup, setLookup] = useState("");

  function onLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = Number(lookup.trim());
    if (!Number.isInteger(id) || id < 1) return;
    void navigate({ to: "/pay/$id", params: { id: String(id) } });
  }

  return (
    <main>
      <section className="mx-auto max-w-3xl px-4 pb-6 pt-14 sm:px-6 sm:pt-24">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">Invoices, settled</p>
        <h1 className="mt-5 max-w-xl font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
          Send the invoice. The payment is checked. Then it is paid.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
          You issue on Creditcoin. The buyer sends USDC on Ethereum. Paidline marks the invoice paid
          only when that transfer is verified. A server is not allowed to say it landed.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to="/new">
            <Button size="lg" className="w-full sm:w-auto">
              Issue an invoice
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </Button>
          </Link>
          <a href="#pay">
            <Button size="lg" variant="ghost" className="w-full sm:w-auto">
              Pay an invoice
            </Button>
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ol className="grid gap-0 divide-y divide-line border-y border-line">
          {[
            {
              n: "01",
              t: "Issue",
              d: "Name the work, the USDC due, and what they receive. Lock Creditcoin against it. Send the link.",
            },
            {
              n: "02",
              t: "Pay",
              d: "The buyer sends USDC on Ethereum. That money never moves to Creditcoin.",
            },
            {
              n: "03",
              t: "Settle",
              d: "Paidline checks the transfer. The invoice flips paid. Locked Creditcoin is released to the payer.",
            },
          ].map((step) => (
            <li key={step.n} className="grid grid-cols-[48px_1fr] gap-4 py-8 sm:grid-cols-[72px_1fr]">
              <span className="font-mono text-xs text-faint">{step.n}</span>
              <div>
                <h2 className="font-display text-3xl tracking-tight">{step.t}</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="pay" className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="rounded-[28px] border border-line bg-surface p-6 sm:p-8">
          <h2 className="font-display text-3xl tracking-tight">Have an invoice?</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Open it by number, or use the payment link the seller sent you.
          </p>
          <form onSubmit={onLookup} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              inputMode="numeric"
              placeholder="Invoice number"
              aria-label="Invoice number"
              className="sm:max-w-[200px]"
            />
            <Button type="submit" size="lg">
              Open
            </Button>
          </form>
        </div>
        <p className="mt-10 text-xs text-faint">
          <Link to="/how" className="underline decoration-line underline-offset-4">
            How payment is checked
          </Link>
        </p>
      </section>
    </main>
  );
}
