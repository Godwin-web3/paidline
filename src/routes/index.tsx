import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductPreview } from "@/components/product-preview";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

const MOVES = [
  {
    n: "01",
    t: "Issue",
    d: "Name the work, the exact USDC due, and what you lock on Creditcoin. You get a number and a payment link.",
  },
  {
    n: "02",
    t: "Pay",
    d: "The buyer sends that USDC on Ethereum, from the wallet they already use. Paidline never holds it.",
  },
  {
    n: "03",
    t: "Stamp",
    d: "A proof of that transfer is submitted. The contract matches token, destination, amount, and expiry. Then it marks the invoice paid and releases the lock.",
  },
] as const;

const SURFACES = [
  {
    to: "/new" as const,
    kicker: "Seller",
    t: "Issue an invoice",
    d: "Title, USDC amount, destination, lock, due date. Written on Creditcoin. Owned by the wallet that created it.",
  },
  {
    to: "/pay" as const,
    kicker: "Buyer",
    t: "Pay an invoice",
    d: "Open the number. Send the exact USDC. The page watches. The contract decides.",
  },
  {
    to: "/invoices" as const,
    kicker: "Workspace",
    t: "See pending become paid",
    d: "Your invoices. Status moves only after a matching Ethereum transfer is checked. The hash is on the row.",
  },
  {
    to: "/how" as const,
    kicker: "Builders",
    t: "Ask isPaid",
    d: "Other contracts call a view or listen for InvoicePaid. They do not talk to the prover themselves.",
  },
];

function Home() {
  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Payment verification on Creditcoin</p>
            <h1 className="mt-4 max-w-xl font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              A payment is not paid until the contract says so.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              Issue an invoice on Creditcoin. The buyer pays USDC on Ethereum. Anyone submits the
              transaction. The contract checks it, matches the invoice, and releases what you locked.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/new">
                <Button size="lg" className="w-full sm:w-auto">
                  Issue an invoice
                  <ArrowRight className="size-4" strokeWidth={1.75} />
                </Button>
              </Link>
              <Link to="/invoices">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                  Open workspace
                </Button>
              </Link>
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section id="product" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs uppercase tracking-wide text-muted">How it works</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl tracking-tight sm:text-5xl">
            Three moves. One stamp.
          </h2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
            {MOVES.map((move) => (
              <li key={move.n} className="bg-surface p-6 sm:p-8">
                <p className="font-mono text-xs text-faint">{move.n}</p>
                <h3 className="mt-3 font-display text-2xl tracking-tight">{move.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{move.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs uppercase tracking-wide text-muted">The product</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl tracking-tight sm:text-5xl">
            Four surfaces. Each one does a job.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            {SURFACES.map((item) => (
              <Link
                key={item.t}
                to={item.to}
                className="group bg-surface p-6 transition-colors duration-150 hover:bg-raised sm:p-8"
              >
                <p className="text-xs uppercase tracking-wide text-faint">{item.kicker}</p>
                <h3 className="mt-3 flex items-center gap-2 font-display text-2xl tracking-tight">
                  {item.t}
                  <ArrowRight
                    className="size-4 text-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-fg"
                    strokeWidth={1.75}
                  />
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{item.d}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">What the contract checks</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Inclusion is not success.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              The transfer must be the right token, to the right address, for the exact amount, on
              an open invoice, unused. Two open invoices cannot share those terms. The first
              matching payment settles it. Replay is rejected.
            </p>
            <p className="mt-8">
              <Link to="/how" className="text-sm underline decoration-line underline-offset-4">
                Read the mechanism
              </Link>
            </p>
          </div>
          <ul className="rounded-xl border border-line bg-surface">
            {[
              ["Receipt status", "Must be 1. A failed transfer does not pay."],
              ["Token and amount", "USDC, exact units. No overpay, no underpay."],
              ["Destination", "The merchant address written on the invoice."],
              ["Replay", "A source hash can settle one invoice, once."],
            ].map(([t, d]) => (
              <li key={t} className="border-b border-line px-5 py-4 last:border-b-0">
                <p className="text-sm font-medium">{t}</p>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col justify-between gap-6 rounded-xl border border-line bg-surface px-6 py-8 sm:flex-row sm:items-center sm:px-8">
          <div>
            <h2 className="font-display text-3xl tracking-tight">Open the workspace.</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Connect the Creditcoin wallet you issue from. Create an invoice. Send the pay link.
            </p>
          </div>
          <Link to="/invoices">
            <Button size="lg" className="w-full sm:w-auto">
              Go to invoices
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
