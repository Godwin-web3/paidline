import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CREDITCOIN_EXPLORER,
  NETWORKS,
  PAIDLINE_ADDRESS,
  PAIDLINE_DEPLOY_TX,
  SEPOLIA_EXPLORER,
  USDC_SEPOLIA,
} from "@/lib/paidline/constants";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/source")({ component: SourcePage });

function SourcePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs uppercase tracking-wide text-muted">Source</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">What is live</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Paidline is a checker on Creditcoin CC3 testnet. Payments are USDC on Ethereum Sepolia.
        Attestcoin proves the transfer. The contract marks paid and releases locked Creditcoin.
        This is a public testnet demo. Demo value is not market value.
      </p>

      <ul className="mt-10 divide-y divide-line rounded-xl border border-line bg-surface">
        <Fact k="Contract" v={PAIDLINE_ADDRESS} href={`${CREDITCOIN_EXPLORER}/address/${PAIDLINE_ADDRESS}`} />
        <Fact k="Deploy" v={PAIDLINE_DEPLOY_TX} href={`${CREDITCOIN_EXPLORER}/tx/${PAIDLINE_DEPLOY_TX}`} />
        <Fact k="Invoice chain" v={`${NETWORKS.creditcoin.name} · ${NETWORKS.creditcoin.network} · ${NETWORKS.creditcoin.chainId}`} />
        <Fact k="Payment" v={`${NETWORKS.sepolia.tokenSymbol} on ${NETWORKS.sepolia.name} ${NETWORKS.sepolia.network}`} />
        <Fact k="USDC" v={USDC_SEPOLIA} href={`${SEPOLIA_EXPLORER}/token/${USDC_SEPOLIA}`} />
        <Fact k="Repo" v="github.com/Godwin-web3/paidline" href="https://github.com/Godwin-web3/paidline" />
      </ul>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-tight">What other contracts call</h2>
        <ul className="mt-4 rounded-xl border border-line bg-surface">
          <li className="border-b border-line px-5 py-5">
            <p className="font-mono text-xs text-fg">isPaid(invoiceId) → bool</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              True only after a matching remote payment has been verified and local value released.
            </p>
          </li>
          <li className="px-5 py-5">
            <p className="font-mono text-xs text-fg">InvoicePaid</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Emitted in the same transaction as the release. Other contracts listen. They do not
              talk to Attestcoin themselves.
            </p>
          </li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/invoices">
          <Button>Open the desk</Button>
        </Link>
        <Link to="/how">
          <Button variant="ghost">How it works</Button>
        </Link>
      </div>
    </main>
  );
}

function Fact({ k, v, href }: { k: string; v: string; href?: string }) {
  return (
    <li className="grid gap-1 px-5 py-4 sm:grid-cols-[8rem_1fr] sm:items-baseline">
      <p className="text-xs uppercase tracking-wide text-faint">{k}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="break-all font-mono text-xs text-fg underline underline-offset-4"
        >
          {v}
        </a>
      ) : (
        <p className="break-all font-mono text-xs text-fg">{v}</p>
      )}
    </li>
  );
}
