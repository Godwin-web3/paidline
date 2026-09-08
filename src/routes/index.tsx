import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Mark } from "@/components/mark";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceSheet } from "@/components/invoice-sheet";

export const Route = createFileRoute("/")({ component: Home });

const STEPS = [
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
] as const;

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
      <section className="relative min-h-[88svh] overflow-hidden">
        <img
          src="/brand/hero.jpg"
          alt="A steel hallmark stamp held above a cream invoice on walnut"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 hero-scrim" />
        <div className="relative mx-auto flex min-h-[88svh] max-w-6xl flex-col justify-end px-4 pb-14 pt-24 sm:px-6 sm:pb-20">
          <p className="text-xs uppercase tracking-wide text-hero-muted">The assay for a payment</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight text-hero sm:text-7xl lg:text-8xl">
            Send the invoice.
            <span className="block italic">Then it is paid.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-hero-muted">
            You issue on Creditcoin. The buyer sends USDC on Ethereum. Paidline marks the invoice
            paid only when that transfer is verified. A server is not allowed to say it landed.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/new">
              <Button size="lg" className="w-full sm:w-auto">
                Issue an invoice
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </Button>
            </Link>
            <a href="#pay">
              <Button size="lg" variant="ghost" className="w-full border-hero/30 text-hero sm:w-auto">
                Pay an invoice
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Two assets. Not a bridge.</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            Remote proof.
            <span className="block italic">Local action.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            The USDC stays on Ethereum. What moves on Creditcoin is a separate balance you locked
            against the invoice. Paidline is the contract that is allowed to connect those two facts.
          </p>
        </div>
        <figure className="overflow-hidden rounded-xl">
          <img
            src="/brand/two-assets.jpg"
            alt="Cream laid paper overlapping oxidized steel"
            className="aspect-3/2 w-full object-cover"
          />
          <figcaption className="mt-3 text-xs text-faint">
            A payment on one chain is not a fact on another until the contract says so.
          </figcaption>
        </figure>
      </section>

      <section className="border-y border-line">
        <ol className="mx-auto grid max-w-6xl md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className={
                i < STEPS.length - 1
                  ? "border-b border-line px-4 py-12 sm:px-6 md:border-b-0 md:border-r"
                  : "px-4 py-12 sm:px-6"
              }
            >
              <span className="font-mono text-xs text-faint">{step.n}</span>
              <h2 className="mt-4 font-display text-4xl tracking-tight">{step.t}</h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{step.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex justify-center">
          <img
            src="/brand/hallmark.jpg"
            alt="Steel hallmark: two ruled lines and a diamond"
            className="w-full max-w-md rounded-full object-cover aspect-square"
          />
        </div>
        <div>
          <Mark className="size-12 text-fg" />
          <h2 className="mt-5 font-display text-4xl tracking-tight sm:text-5xl">
            The contract is the stamp.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Two lines: the payment, and the release. The diamond is the verified fact. Other
            contracts ask <span className="font-mono text-fg">isPaid</span>. They listen for{" "}
            <span className="font-mono text-fg">InvoicePaid</span>. They do not integrate
            Attestcoin.
          </p>
          <p className="mt-6">
            <Link to="/how" className="text-sm underline decoration-line underline-offset-4">
              How payment is checked
            </Link>
          </p>
        </div>
      </section>

      <section id="pay" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <figure className="overflow-hidden rounded-xl">
            <img
              src="/brand/specimen.jpg"
              alt="An invoice sheet with a pressed circular seal on walnut"
              className="h-full min-h-72 w-full object-cover"
            />
          </figure>
          <InvoiceSheet className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">Have an invoice?</p>
              <h2 className="mt-3 font-display text-4xl tracking-tight">Open it by number</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
                Use the payment link the seller sent, or enter the number here.
              </p>
            </div>
            <form onSubmit={onLookup} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="grid flex-1 gap-1.5">
                <span className="text-xs uppercase tracking-wide text-ink-muted">Invoice</span>
                <Input
                  value={lookup}
                  onChange={(e) => setLookup(e.target.value)}
                  inputMode="numeric"
                  placeholder="1"
                  aria-label="Invoice number"
                  className="border-rule bg-paper text-ink placeholder:text-ink-muted"
                />
              </label>
              <Button type="submit" size="lg" variant="ink">
                Open
              </Button>
            </form>
          </InvoiceSheet>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
