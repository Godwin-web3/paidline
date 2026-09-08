import { createFileRoute, Link } from "@tanstack/react-router";
import { CREDITCOIN_EXPLORER, PAIDLINE_ADDRESS } from "@/lib/paidline/constants";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

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
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs uppercase tracking-wide text-muted">How it works</p>
          <h1 className="mt-3 max-w-xl font-display text-5xl tracking-tight sm:text-6xl">
            Remote proof.
            <span className="mt-2 block">Local action.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            The seller issues an invoice. The buyer sends USDC like any other transfer. Underneath,
            Paidline checks that transfer on Ethereum, then releases what was locked on Creditcoin.
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

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs uppercase tracking-wide text-muted">For other contracts</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight">What they call</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Paidline is the checker. You do not integrate Attestcoin yourself. Ask whether an invoice
          is paid, or listen when it becomes paid, then run your own logic.
        </p>
        <ul className="mt-8 rounded-xl border border-line bg-surface">
          <li className="border-b border-line px-5 py-5">
            <p className="font-mono text-xs text-fg">isPaid(invoiceId) → bool</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              True only after a matching remote payment has been verified and local value released.
              Unknown invoices return false.
            </p>
          </li>
          <li className="px-5 py-5">
            <p className="font-mono text-xs text-fg">InvoicePaid</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Emitted in the same transaction as the release. Indexed on invoice, source
              transaction, and the wallet that received Creditcoin.
            </p>
          </li>
        </ul>
        <p className="mt-6 break-all font-mono text-xs text-faint">
          <a
            className="underline underline-offset-4"
            href={`${CREDITCOIN_EXPLORER}/address/${PAIDLINE_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            {PAIDLINE_ADDRESS}
          </a>
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/new">
            <Button>Issue an invoice</Button>
          </Link>
          <Link to="/invoices">
            <Button variant="ghost">Open workspace</Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
