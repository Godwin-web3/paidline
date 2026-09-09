import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { OpenBoard } from "@/components/open-board";
import { ProductFrame } from "@/components/product-frame";
import { SettledFeed } from "@/components/settled-feed";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-20">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Public marketplace + payment checker</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              List work.
              <span className="mt-1 block italic">Anyone can buy it.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
              Paidline is a public board of things for sale. Buyers pay in USDC on Ethereum. A
              contract on Creditcoin confirms the payment. First matching payment gets the listing.
              No company in the middle.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link to="/board">
                <Button size="lg" className="w-full sm:w-auto">
                  Browse marketplace
                  <ArrowRight className="size-4" strokeWidth={1.75} />
                </Button>
              </Link>
              <Link to="/new">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                  Create a listing
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-faint">Free to look. Wallet only when you list or pay.</p>
          </div>
          <ProductFrame url="paidline.vercel.app/marketplace">
            <p className="mb-3 px-1 text-xs uppercase tracking-wide text-muted">Open listings</p>
            <OpenBoard compact />
            <p className="mt-3 px-1 text-xs text-faint">First payment claims it.</p>
          </ProductFrame>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs uppercase tracking-wide text-muted">How it works</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-5xl">
            Four steps. Then it’s paid.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            You do not need to understand two blockchains to use this. Here is the plain version.
          </p>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1", "List", "You publish what you’re selling, the USDC price, and a small Creditcoin lock."],
              ["2", "Pay", "A buyer sends that exact USDC from any Ethereum wallet. Paidline never holds it."],
              ["3", "Check", "A proof of that transfer is submitted. The contract checks token, address, and amount."],
              ["4", "Confirm", "The listing is marked paid. The lock goes to the buyer. Other apps can ask “is it paid?”"],
            ].map(([n, t, d]) => (
              <li key={n} className="bg-surface p-5 sm:p-6">
                <p className="font-mono text-xs text-faint">{n}</p>
                <h3 className="mt-3 font-display text-2xl tracking-tight">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="who" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs uppercase tracking-wide text-muted">Who it’s for</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            Sellers, buyers, agents, and other apps.
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            <li className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-display text-2xl tracking-tight">Sellers</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Put a retainer, a seat, or an API credit on the board. You do not pick the buyer.
                USDC lands in your wallet.
              </p>
              <Link
                to="/new"
                className="mt-5 inline-flex min-h-11 items-center text-sm text-fg underline decoration-line underline-offset-4"
              >
                Create a listing
              </Link>
            </li>
            <li className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-display text-2xl tracking-tight">Buyers</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Open the marketplace. Send USDC the way you already send it. First match wins the
                listing.
              </p>
              <Link
                to="/board"
                className="mt-5 inline-flex min-h-11 items-center text-sm text-fg underline decoration-line underline-offset-4"
              >
                See what’s for sale
              </Link>
            </li>
            <li className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-display text-2xl tracking-tight">Agents</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Call an API. If it’s unpaid you get HTTP 402 and a pay link. After payment, the same
                call returns 200.
              </p>
              <Link
                to="/gate"
                className="mt-5 inline-flex min-h-11 items-center text-sm text-fg underline decoration-line underline-offset-4"
              >
                Try the API
              </Link>
            </li>
            <li className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-display text-2xl tracking-tight">Other apps</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Don’t rebuild payments. Ask the contract if a listing is paid, then unlock the work.
              </p>
              <Link
                to="/docs"
                className="mt-5 inline-flex min-h-11 items-center text-sm text-fg underline decoration-line underline-offset-4"
              >
                Read the docs
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs uppercase tracking-wide text-muted">Questions</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">If you’re new here</h2>
          <dl className="mt-10 divide-y divide-line border-y border-line">
            {[
              [
                "Do I need a special wallet?",
                "No, to look. To list, connect a Creditcoin wallet. To pay, send USDC from the Ethereum wallet you already have.",
              ],
              [
                "Who receives the USDC?",
                "The seller. Paidline never holds the dollars. The buyer receives the Creditcoin that was locked against the listing.",
              ],
              [
                "What if two people pay?",
                "The first matching payment the contract accepts wins. A second transfer of the same amount is not a second listing.",
              ],
              [
                "Why two chains?",
                "Buyers live on Ethereum. The listing and the “paid” flag live on Creditcoin. Paidline is the checker between them.",
              ],
            ].map(([q, a]) => (
              <div key={q} className="grid gap-2 py-6 sm:grid-cols-[minmax(0,16rem)_1fr] sm:gap-8">
                <dt className="font-medium">{q}</dt>
                <dd className="text-sm leading-relaxed text-muted">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="paid" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs uppercase tracking-wide text-muted">Live</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Recently paid</h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            These listings already cleared. No wallet needed to watch.
          </p>
          <div className="mt-8">
            <SettledFeed />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="overflow-hidden rounded-xl border border-line">
          <img
            src="/brand/hero.jpg"
            alt="Steel stamp over an invoice on walnut"
            className="h-48 w-full object-cover sm:h-64"
          />
          <div className="flex flex-col gap-4 bg-surface px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <h2 className="font-display text-3xl tracking-tight">Start with a listing.</h2>
              <p className="mt-2 max-w-md text-sm text-muted">
                Publish it. It appears on the marketplace. The first matching payment confirms it.
              </p>
            </div>
            <Link to="/new">
              <Button size="lg">
                Create a listing
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
