import { createFileRoute, Link } from "@tanstack/react-router";
import { CREDITCOIN_EXPLORER, PAIDLINE_ADDRESS } from "@/lib/paidline/constants";

export const Route = createFileRoute("/how")({ component: HowPage });

function HowPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">How it works</p>
      <h1 className="mt-3 max-w-xl font-display text-4xl tracking-tight sm:text-5xl">
        Remote proof. Local action.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
        The seller sees an invoice. The buyer sees a payment page. Underneath, Paidline checks that
        a USDC transfer happened on Ethereum, then releases what you locked on Creditcoin.
      </p>

      <ol className="mt-12 grid gap-0 divide-y divide-line border-y border-line">
        {[
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
        ].map((step) => (
          <li key={step.n} className="grid grid-cols-[48px_1fr] gap-4 py-8 sm:grid-cols-[72px_1fr]">
            <span className="font-mono text-xs text-faint">{step.n}</span>
            <div>
              <h2 className="font-display text-2xl tracking-tight">{step.t}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{step.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-12 rounded-[28px] border border-line bg-surface p-6 sm:p-8">
        <h2 className="font-display text-2xl tracking-tight">What you are looking at</h2>
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
      </section>

      <p className="mt-10 text-sm text-muted">
        <Link to="/new" className="underline decoration-line underline-offset-4">
          Issue an invoice
        </Link>
      </p>
    </main>
  );
}
