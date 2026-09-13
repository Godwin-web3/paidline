import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { NetworkPills } from "@/components/network-pills";
import { OpenBoard } from "@/components/open-board";
import { ProductPreview } from "@/components/product-preview";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Paidline — Public marketplace. On-chain paid." }],
  }),
  component: Home,
});

function Home() {
  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:py-20">
          <div>
            <p className="kicker">Public marketplace · payment checker</p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.75rem]">
              List work.
              <span className="mt-1 block italic text-muted">Anyone can buy it.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              A public board of things for sale. Buyers send USDC on Ethereum. Attestcoin proves the
              transfer. A Creditcoin contract is the only thing that may say it is paid.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link to="/pay">
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
            <NetworkPills className="mt-8" />
            <p className="mt-4 text-xs text-faint">Looking is free. Wallet only when you list or pay.</p>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="kicker">Live listings</p>
              <Link to="/pay" className="text-xs text-muted hover:text-fg">
                See all
              </Link>
            </div>
            <div className="mt-3">
              <OpenBoard compact />
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="kicker">How it works</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-5xl">
            Four steps. Then it’s paid.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            You do not need to operate two chains. List. Pay. The contract checks. Other apps ask
            isPaid.
          </p>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "List", "Creditcoin", "Attach the work, the exact USDC price, and a small Creditcoin lock. The work stays sealed."],
              ["02", "Pay", "Ethereum", "A buyer sends that USDC from any wallet. Paidline never holds it."],
              ["03", "Prove", "Attestcoin", "A Merkle proof of that transfer is submitted. The submitter has no opinion."],
              ["04", "Confirm", "isPaid", "The listing is paid. Checkout unlocks the work. Other contracts can ask."],
            ].map(([n, t, chain, d]) => (
              <li key={n} className="bg-surface p-5 sm:p-6">
                <p className="flex items-center justify-between font-mono text-[11px] text-faint">
                  <span>{n}</span>
                  <span className="uppercase tracking-wide">{chain}</span>
                </p>
                <h3 className="mt-4 font-display text-2xl tracking-tight">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="kicker">What this is not</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            A checker. Not a custodian.
          </h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {[
              ["Not a bridge", "USDC never moves to Creditcoin. Only the fact of payment does."],
              ["Not escrow of the dollars", "The seller is paid on Ethereum. The lock is a receipt bond."],
              ["Not a private board", "Every funded listing is public. First matching payment claims it."],
            ].map(([t, d]) => (
              <li key={t} className="bg-surface p-6">
                <h3 className="font-display text-2xl tracking-tight">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="who" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="kicker">Who it’s for</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            Sellers, buyers, agents, and other apps.
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            <Audience
              title="Sellers"
              body="Put a retainer, a seat, or an API credit on the board. You do not pick the buyer. USDC lands in your wallet."
              to="/new"
              label="Create a listing"
            />
            <Audience
              title="Buyers"
              body="Open the marketplace. Send USDC the way you already send it. First match wins the listing."
              to="/pay"
              label="See what’s for sale"
            />
            <Audience
              title="Agents"
              body="Call an API. If it’s unpaid you get HTTP 402 and a pay link. After payment, the same call returns 200 and the work."
              to="/gate"
              label="Try the API"
            />
            <Audience
              title="Other apps"
              body="Don’t rebuild payments. Ask the contract if a listing is paid, then unlock the work."
              to="/docs"
              label="Read the docs"
            />
          </ul>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="kicker">Questions</p>
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
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="kicker">What confirmation looks like</p>
            <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
              A receipt the contract stamped.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              After Attestcoin verifies the Sepolia transfer, Paidline marks the listing paid and
              releases the lock. Other contracts never talk to the prover. They call isPaid.
            </p>
            <Link
              to="/docs"
              className="mt-6 inline-flex min-h-11 items-center text-sm underline decoration-line underline-offset-4"
            >
              Read the Attestcoin path
            </Link>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-6 overflow-hidden rounded-xl border border-line bg-surface px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="font-display text-3xl tracking-tight">Start with a listing.</h2>
            <p className="mt-2 max-w-md text-sm text-muted">
              Publish it. It appears on the marketplace. The first matching payment confirms it.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/new">
              <Button size="lg" className="w-full sm:w-auto">
                Create a listing
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </Button>
            </Link>
            <Link to="/pay">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                Browse live listings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Audience({
  title,
  body,
  to,
  label,
}: {
  title: string;
  body: string;
  to: "/new" | "/pay" | "/gate" | "/docs";
  label: string;
}) {
  return (
    <li className="rounded-xl border border-line bg-surface p-6">
      <h3 className="font-display text-2xl tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      <Link
        to={to}
        className="mt-5 inline-flex min-h-11 items-center text-sm text-fg underline decoration-line underline-offset-4"
      >
        {label}
      </Link>
    </li>
  );
}
