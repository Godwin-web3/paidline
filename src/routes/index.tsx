import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { Mark } from "@/components/mark";
import { ProductPreview } from "@/components/product-preview";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceSheet } from "@/components/invoice-sheet";

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
      <section className="relative min-h-[88svh] overflow-hidden">
        <img
          src="/brand/hero.jpg"
          alt="A steel hallmark stamp held above a cream invoice on walnut"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 hero-scrim" />
        <div className="relative mx-auto flex min-h-[88svh] max-w-6xl flex-col justify-end px-4 pb-14 pt-24 sm:px-6 sm:pb-20">
          <p className="text-xs uppercase tracking-wide text-hero-muted">The assay for a payment</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[0.95] tracking-tight text-hero sm:text-6xl lg:text-8xl">
            A transfer is not a paid invoice.
            <span className="mt-3 block italic">Not until the contract says so.</span>
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-hero-muted sm:text-base">
            A USDC transfer on Ethereum is not a paid invoice on Creditcoin. Not until a contract
            reads that transaction, matches it, and says so. No company in the middle is allowed to
            report the fact.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/invoices">
              <Button size="lg" className="w-full sm:w-auto">
                Open the desk
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </Button>
            </Link>
            <Link to="/how">
              <Button size="lg" variant="ghost" className="w-full border-hero/30 text-hero sm:w-auto">
                How it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="product" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-xs uppercase tracking-wide text-muted">The pain</p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl tracking-tight sm:text-5xl">
            The payment happened. The other chain does not know.
          </h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <p className="max-w-xl text-base leading-relaxed text-muted">
              Seller is on Creditcoin. Buyer pays in USDC on Ethereum. Those are two ledgers. A
              bridge would wrap the money. An API would write “paid” in a database. Either way
              someone in the middle is the source of truth. A bot. A support ticket. A three-day
              hold.
            </p>
            <p className="max-w-xl text-base leading-relaxed text-muted">
              Paidline does not move the USDC. It does not ask you to trust a server. The invoice
              lives on Creditcoin. The buyer sends USDC the way they send it anywhere else. The
              contract checks the Ethereum transaction. Then it releases what you locked. One
              stamp. Two assets.
            </p>
          </div>
        </div>
      </section>

      <section id="people" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-xs uppercase tracking-wide text-muted">Two people</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            A seller. A buyer.
            <span className="block italic">Nothing exotic on screen.</span>
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
            <article className="bg-surface p-6 sm:p-10">
              <p className="font-mono text-xs text-faint">01 · Seller</p>
              <h3 className="mt-3 font-display text-3xl tracking-tight">Create the invoice</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Name the work. Set a USDC price. Say what the buyer receives. Lock Creditcoin
                against it so the release is sitting there ready. You get a number and a payment
                link. Looks like any invoice tool.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted">
                {[
                  "What you are selling",
                  "Exact USDC due on Ethereum",
                  "What gets released when it clears",
                  "A link you send. That is the whole setup.",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-paid" strokeWidth={2} />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-8">
                <Link to="/new" className="text-sm underline decoration-line underline-offset-4">
                  Open the issue form
                </Link>
              </p>
            </article>
            <article className="bg-surface p-6 sm:p-10">
              <p className="font-mono text-xs text-faint">02 · Buyer</p>
              <h3 className="mt-3 font-display text-3xl tracking-tight">Pay the invoice</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                They open “Pay Invoice #4821.” The page says: send this USDC to this address on
                Ethereum. They use the wallet they already have. No new chain to learn. No new
                account. Sending crypto, the way they already send it.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted">
                {[
                  "Amount and destination. Nothing else to decide.",
                  "Pay from a wallet, or send and wait.",
                  "Paidline watches for the exact transfer.",
                  "The first matching payment settles it.",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-paid" strokeWidth={2} />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-8">
                <a href="#pay" className="text-sm underline decoration-line underline-offset-4">
                  Open an invoice by number
                </a>
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="settle" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-xl">
            <img
              src="/brand/two-assets.jpg"
              alt="Cream laid paper overlapping oxidized steel"
              className="aspect-3/2 w-full object-cover"
            />
          </figure>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Invisible to both of them</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              The script notices.
              <span className="block italic">The contract decides.</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              When the USDC lands, Paidline fetches a proof of that Ethereum transaction and
              submits it on Creditcoin. Neither person files a ticket. The contract checks token,
              destination, exact amount, expiry. If it matches, the invoice flips paid and the
              locked Creditcoin releases to the paying wallet. About one Creditcoin block. No
              email from support. No three-day hold.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">The desk</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Pending. Then paid.
              <span className="block italic">With the Ethereum hash.</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Invoice #4821 goes from pending to paid. The seller sees a check and a link to the
              actual transfer. Not a database row someone could type. Not a screenshot. The
              contract already matched amount, recipient, and token before the status moved.
            </p>
            <p className="mt-8">
              <Link to="/invoices" className="text-sm underline decoration-line underline-offset-4">
                Open the workspace
              </Link>
            </p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex justify-center">
            <img
              src="/brand/hallmark.jpg"
              alt="Steel hallmark: two ruled lines and a diamond"
              className="aspect-square w-full max-w-md rounded-full object-cover"
            />
          </div>
          <div>
            <Mark className="size-12 text-fg" />
            <h2 className="mt-5 font-display text-4xl tracking-tight sm:text-5xl">
              The contract is the assay.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              The seller and the buyer sit on different chains. Neither wants a company in the
              middle to honestly report whether a payment happened. They want the Ethereum
              transaction checked. Not a row someone could fake. Not a server someone could hack.
            </p>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Other contracts ask <span className="font-mono text-fg">isPaid</span>. They listen
              for <span className="font-mono text-fg">InvoicePaid</span>. They do not integrate
              Attestcoin.
            </p>
            <p className="mt-6">
              <Link to="/how" className="text-sm underline decoration-line underline-offset-4">
                How the contract checks
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section id="pay" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 sm:px-6">
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
              <p className="text-xs uppercase tracking-wide text-ink-muted">Have a payment link?</p>
              <h2 className="mt-3 font-display text-4xl tracking-tight">Open the invoice</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
                Use the link the seller sent, or enter the number. Send the USDC. The page watches
                for the transfer.
              </p>
            </div>
            <form onSubmit={onLookup} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end">
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
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
