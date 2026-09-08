import { createFileRoute, Link } from "@tanstack/react-router";
import { CREDITCOIN_EXPLORER, PAIDLINE_ADDRESS } from "@/lib/paidline/constants";
import { Mark } from "@/components/mark";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/how")({ component: HowPage });

const STEPS = [
  {
    n: "01",
    t: "The invoice is the instruction",
    d: "Chain, token, destination, amount, expiry, and what the buyer receives are written on Creditcoin. If you lock Creditcoin with it, that balance is what later moves. Each invoice is owned by the wallet that issued it.",
  },
  {
    n: "02",
    t: "The payment stays where it is",
    d: "The buyer sends the exact USDC due on Ethereum. Paidline never receives that USDC. This is not a bridge.",
  },
  {
    n: "03",
    t: "A proof is submitted",
    d: "Anyone may submit the Ethereum transaction. Paidline asks Attestcoin whether that transaction is in the chain. The submitter does not get to assert that it is.",
  },
  {
    n: "04",
    t: "The contract matches, or it does not",
    d: "The transfer must be the right token, to the right address, for the exact amount, on an open invoice, and unused. Two open invoices cannot share those terms, so a payment can only mean one invoice. Anything else is rejected.",
  },
  {
    n: "05",
    t: "Paid, in the same transaction",
    d: "The invoice flips paid. Locked Creditcoin is released to the paying wallet. No gap for a backend to speak.",
  },
] as const;

function HowPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-line">
        <img
          src="/brand/hero.jpg"
          alt="A steel hallmark stamp above a cream invoice"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 hero-scrim" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-xs uppercase tracking-wide text-hero-muted">How it works</p>
          <h1 className="mt-3 max-w-xl font-display text-5xl tracking-tight text-hero sm:text-6xl">
            Remote proof.
            <span className="block italic">Local action.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-hero-muted">
            The seller issues an invoice. The buyer sends USDC like any other transfer. Underneath,
            Paidline checks that transfer on Ethereum, then releases what was locked on Creditcoin.
            The people do not operate the proof.
          </p>
        </div>
      </section>

      <ol className="mx-auto max-w-3xl px-4 sm:px-6">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="grid grid-cols-[48px_1fr] gap-4 border-b border-line py-10 sm:grid-cols-[72px_1fr] sm:py-12"
          >
            <span className="font-mono text-xs text-faint">{step.n}</span>
            <div>
              <h2 className="font-display text-3xl tracking-tight">{step.t}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{step.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mx-auto grid max-w-3xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <figure className="overflow-hidden rounded-xl">
          <img
            src="/brand/two-assets.jpg"
            alt="Paper overlapping steel"
            className="h-full w-full object-cover"
          />
        </figure>
        <div className="flex flex-col justify-center">
          <h2 className="font-display text-3xl tracking-tight">What you are looking at</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Paidline is live on Creditcoin. Payments are USDC on Ethereum Sepolia, because that is
            the chain Attestcoin currently reads. The local balance is Creditcoin, not wrapped USDC.
            Merchants only see invoices they issued. The first matching payment settles an invoice.
          </p>
          <p className="mt-4 break-all font-mono text-xs text-faint">
            <a
              className="underline underline-offset-4"
              href={`${CREDITCOIN_EXPLORER}/address/${PAIDLINE_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              {PAIDLINE_ADDRESS}
            </a>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <Mark className="size-10" />
          <h2 className="mt-5 font-display text-3xl tracking-tight">What other contracts call</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Paidline is the checker. You do not integrate Attestcoin yourself. Ask whether an
            invoice is paid, or listen when it becomes paid, then run your own logic.
          </p>
          <ul className="mt-6 space-y-5 text-sm leading-relaxed text-muted">
            <li>
              <p className="font-mono text-xs text-fg">isPaid(invoiceId) → bool</p>
              <p className="mt-1">
                True only after a matching remote payment has been verified and local value
                released. Unknown invoices return false.
              </p>
            </li>
            <li>
              <p className="font-mono text-xs text-fg">InvoicePaid</p>
              <p className="mt-1">
                Emitted in the same transaction as the release. Indexed on invoice, source
                transaction, and the wallet that received Creditcoin.
              </p>
            </li>
          </ul>
        </div>
        <p className="mt-10 text-sm text-muted">
          <Link to="/new" className="underline decoration-line underline-offset-4">
            Issue an invoice
          </Link>
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
