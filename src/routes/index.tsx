import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { SettledFeed } from "@/components/settled-feed";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceSheet } from "@/components/invoice-sheet";

export const Route = createFileRoute("/")({
  component: Home,
});

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
      <section className="relative overflow-hidden">
        <img
          src="/brand/hero.jpg"
          alt="A steel hallmark stamp held above a cream invoice on walnut"
          className="h-56 w-full object-cover sm:h-80 lg:h-96"
        />
        <div className="absolute inset-0 hero-scrim" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-5 sm:px-6 sm:pb-8">
          <p className="text-[11px] uppercase tracking-wide text-hero-muted">The assay for a payment</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl leading-tight tracking-tight text-hero sm:text-5xl">
            A transfer is not a paid invoice.
            <span className="mt-1 block italic">Not until the contract says so.</span>
          </h1>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-10">
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Issue on Creditcoin. Buyer sends USDC on Ethereum. Attestcoin proves the transfer.
            Paidline stamps the invoice. No company in the middle reports the fact.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link to="/invoices">
              <Button size="lg" className="w-full sm:w-auto">
                Open the desk
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                How it works
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs uppercase tracking-wide text-muted">How it works</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Four checks. Then paid.</h2>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "USDC", "Buyer sends the exact amount on Ethereum. Paidline never holds it."],
              ["02", "Attestcoin", "A proof that the Ethereum transaction is in the chain. Not a server saying so."],
              ["03", "Paidline", "The contract matches token, destination, amount. One payment, one invoice."],
              ["04", "Creditcoin", "isPaid flips true. Locked value releases. InvoicePaid is emitted."],
            ].map(([n, t, d]) => (
              <li key={n} className="bg-surface p-5 sm:p-6">
                <p className="font-mono text-xs text-faint">{n}</p>
                <h3 className="mt-2 font-display text-2xl tracking-tight">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted">
            The stack is Ethereum, Attestcoin, and Creditcoin. Paidline is the checker in the
            middle.{" "}
            <Link to="/docs" hash="how" className="underline decoration-line underline-offset-4">
              Full docs
            </Link>
          </p>
        </div>
      </section>

      <section id="who" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs uppercase tracking-wide text-muted">Who it is for</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">A payment that means something.</h2>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {[
              ["Seller", "Invoice in USDC. Watch pending become paid."],
              ["Buyer", "Send from the wallet they already have."],
              ["Builder", "Gate on isPaid. Or 402 until the stamp."],
            ].map(([t, d]) => (
              <li key={t} className="bg-surface p-5 sm:p-6">
                <h3 className="font-display text-2xl tracking-tight">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="settled" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs uppercase tracking-wide text-muted">Live</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Recently settled</h2>
          <div className="mt-6">
            <SettledFeed />
          </div>
        </div>
      </section>

      <section id="pay" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16">
        <InvoiceSheet className="mx-auto max-w-lg p-6 sm:p-8">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Have a number?</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">Pay an invoice</h2>
          <form onSubmit={onLookup} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid flex-1 gap-1.5">
              <span className="text-xs uppercase tracking-wide text-ink-muted">Invoice</span>
              <Input
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
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
        </InvoiceSheet>
        <p className="mt-8 text-center text-xs text-faint">
          Creditcoin CC3 testnet. USDC on Ethereum Sepolia. Demo value is not market value.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
