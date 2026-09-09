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
          className="h-52 w-full object-cover sm:h-72 lg:h-80"
        />
        <div className="absolute inset-0 hero-scrim" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-5 sm:px-6 sm:pb-8">
          <p className="text-[11px] uppercase tracking-wide text-hero-muted">Paidline</p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl leading-tight tracking-tight text-hero sm:text-5xl">
            The USDC moved.
            <span className="mt-1 block italic">The invoice did not.</span>
          </h1>
        </div>
      </section>

      <section id="problem" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="font-display text-sm italic text-muted">The problem</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl tracking-tight sm:text-5xl">
            Two ledgers. No fact between them.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            A seller on Creditcoin. A buyer who pays in dollars on Ethereum. The transfer happened.
            Someone in the middle is supposed to say the invoice is paid. A database. A bot. A
            three-day hold.
          </p>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {[
              ["01", "Two chains", "The money is on Ethereum. The invoice is on Creditcoin. They do not talk."],
              ["02", "A middleman", "A company, a spreadsheet, or a bot is asked to report the payment."],
              ["03", "No stamp", "Until someone says so, the work stays locked. A transfer is not a paid invoice."],
            ].map(([n, t, d]) => (
              <li key={n} className="bg-surface p-5 sm:p-7">
                <p className="font-mono text-xs text-faint">{n}</p>
                <h3 className="mt-3 font-display text-2xl tracking-tight">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="solution" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="font-display text-sm italic text-muted">The solution</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl tracking-tight sm:text-5xl">
            Paidline is a checker.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            You write the invoice on Creditcoin. The buyer sends USDC the way they already send it.
            Attestcoin proves the Ethereum transaction is in the chain. Paidline matches the token,
            the destination, and the exact amount. Then the contract stamps it paid.
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            No company in the middle reports the fact. Other contracts just ask{" "}
            <span className="font-mono text-fg">isPaid</span>.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link to="/invoices">
              <Button size="lg" className="w-full sm:w-auto">
                Open the desk
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </Button>
            </Link>
            <a href="#flow">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                See the flow
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="flow" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="font-display text-sm italic text-muted">The flow</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-5xl">
            Issue. Pay. Prove. Stamp.
          </h2>
          <ol className="mt-10 divide-y divide-line border-y border-line">
            {[
              ["Issue", "Write the invoice on Creditcoin. Lock a little Creditcoin against it."],
              ["Pay", "Buyer sends the exact USDC on Ethereum. Paidline never holds it."],
              ["Prove", "Attestcoin says the transfer is in the chain. Not a server."],
              ["Stamp", "Token, destination, amount match. isPaid flips true. Locked value releases."],
            ].map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[3rem_1fr] gap-4 py-6 sm:grid-cols-[4rem_12rem_1fr] sm:items-baseline">
                <span className="font-mono text-xs text-faint">0{i + 1}</span>
                <h3 className="font-display text-2xl tracking-tight">{t}</h3>
                <p className="col-span-2 text-sm leading-relaxed text-muted sm:col-span-1">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="who" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="font-display text-sm italic text-muted">Who it is for</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            A payment that means something.
          </h2>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {[
              ["Seller", "Invoice in USDC. Watch pending become paid."],
              ["Buyer", "Send from the wallet they already have."],
              ["Builder", "Gate on isPaid. Or 402 until the stamp."],
            ].map(([t, d]) => (
              <li key={t} className="bg-surface p-5 sm:p-7">
                <h3 className="font-display text-2xl tracking-tight">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="settled" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="font-display text-sm italic text-muted">Proof</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Recently settled</h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            No wallet. These are invoices the contract already stamped.
          </p>
          <div className="mt-8">
            <SettledFeed />
          </div>
        </div>
      </section>

      <section id="pay" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20">
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
                placeholder="5"
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
