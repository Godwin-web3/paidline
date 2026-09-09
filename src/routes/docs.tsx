import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CREDITCOIN_EXPLORER,
  NETWORKS,
  PAIDLINE_ADDRESS,
  PAIDLINE_DEPLOY_TX,
  SEPOLIA_EXPLORER,
  USDC_SEPOLIA,
} from "@/lib/paidline/constants";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/docs")({ component: DocsPage });

const TOC = [
  { href: "#what", label: "What it is" },
  { href: "#how", label: "How it works" },
  { href: "#stack", label: "The stack" },
  { href: "#who", label: "Who uses it" },
  { href: "#ispai", label: "isPaid" },
  { href: "#x402", label: "x402" },
  { href: "#source", label: "Contract" },
] as const;

const ISPAID = `interface IPaidline {
    function isPaid(uint256 invoiceId) external view returns (bool);
    event InvoicePaid(
        uint256 indexed invoiceId,
        bytes32 indexed sourceTxHash,
        address indexed releasedTo,
        uint256 localAmount
    );
}

contract Example {
    IPaidline public immutable paidline;

    constructor(IPaidline checker) {
        paidline = checker;
    }

    function claim(uint256 invoiceId) external {
        require(paidline.isPaid(invoiceId), "unpaid");
        // release the work
    }
}`;

const GATE = `const res = await fetch(\`\${origin}/api/gate/\${invoiceId}\`)
if (res.status === 402) {
  const { pay } = await res.json()
  // send the buyer or agent to pay, then retry
}
if (res.status === 200) {
  const body = await res.json()
  // serve the resource
}`;

function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
      <aside className="mb-10 lg:sticky lg:top-8 lg:mb-0 lg:self-start">
        <p className="text-xs uppercase tracking-wide text-faint">Documentation</p>
        <nav className="mt-4 flex flex-col gap-1">
          {TOC.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-10 items-center text-sm text-muted hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <article className="max-w-2xl pb-16">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Docs</h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Paidline is a checker. An invoice lives on Creditcoin. A USDC transfer happens on
          Ethereum. The contract is the only thing that may say the invoice is paid.
        </p>

        <section id="what" className="scroll-mt-24 border-t border-line pt-12 mt-12">
          <h2 className="font-display text-3xl tracking-tight">What it is</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Not a bridge. Not a credit score. Not a company that reports a payment. The seller
            writes terms. The buyer sends the exact USDC. A proof of that Ethereum transaction is
            submitted on Creditcoin. If token, destination, and amount match an open invoice, the
            invoice flips paid and locked Creditcoin releases to the paying wallet.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Two open invoices cannot share the same chain, token, destination, and amount. One
            payment can only mean one invoice. There is no buyer list. Locked Creditcoin releases
            to the wallet that sent the matching transfer. First payment claims it.
          </p>
        </section>

        <section id="how" className="scroll-mt-24 border-t border-line pt-12 mt-12">
          <h2 className="font-display text-3xl tracking-tight">How it works</h2>
          <ol className="mt-6 divide-y divide-line">
            {[
              ["01", "Issue", "The invoice is written on Creditcoin: amount, destination, expiry, what the buyer receives. Creditcoin may be locked against it."],
              ["02", "Pay", "The buyer sends USDC on Ethereum. Paidline never receives that USDC."],
              ["03", "Prove", "Anyone may submit the Ethereum transaction. Attestcoin says whether it is in the chain. The submitter does not get to assert that it is."],
              ["04", "Match", "Right token, right address, exact amount, open invoice, unused hash. Anything else is rejected."],
              ["05", "Stamp", "isPaid becomes true. InvoicePaid is emitted. Locked Creditcoin releases. Same transaction."],
            ].map(([n, t, d]) => (
              <li key={n} className="grid grid-cols-[3rem_1fr] gap-3 py-5">
                <span className="font-mono text-xs text-faint">{n}</span>
                <div>
                  <h3 className="font-medium">{t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="stack" className="scroll-mt-24 border-t border-line pt-12 mt-12">
          <h2 className="font-display text-3xl tracking-tight">The stack</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Paidline does not invent a new proof system. It sits on three pieces that already exist.
          </p>
          <ul className="mt-6 grid gap-4">
            {[
              ["Ethereum", "The buyer sends USDC here. Sepolia in this demo. Paidline never receives that transfer."],
              ["Attestcoin", "The Creditcoin native prover. It says whether an Ethereum transaction is in the chain, with a Merkle proof and continuity. A relayer submits that proof. The submitter does not get to assert the fact."],
              ["Creditcoin", "The invoice, isPaid, and the optional locked balance live here. CC3 testnet in this demo. Other contracts call this chain, not Ethereum."],
              ["Paidline", "The checker. Matches token, destination, exact amount, expiry, unused hash. Emits InvoicePaid. Releases locked Creditcoin to the paying wallet."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-xl border border-line bg-surface p-5">
                <h3 className="font-medium">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="who" className="scroll-mt-24 border-t border-line pt-12 mt-12">
          <h2 className="font-display text-3xl tracking-tight">Who uses it</h2>
          <ul className="mt-6 grid gap-4">
            {[
              ["A seller on Creditcoin", "They invoice in USDC. The buyer pays on Ethereum the way they already pay. The desk shows pending, then paid, with the hash."],
              ["A buyer who will not open a new chain", "They get a number and an amount. They send USDC. They do not operate the proof."],
              ["An agent calling an API", "The endpoint returns 402 until the invoice is paid. After the stamp, the same request returns the resource. x402 with your checker, not someone else’s."],
              ["Another contract", "It calls isPaid or listens for InvoicePaid. It does not integrate Attestcoin. Paidline is the checker."],
              ["A marketplace that will not hold funds", "The board is the marketplace. Listings are public. First matching USDC claims the lock. No auction contract. No admin wallet."],
              ["A protocol gating work", "Mint, unlock, flip a role — after isPaid is true. The payment is the fact. Your contract is the consequence."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-xl border border-line bg-surface p-5">
                <h3 className="font-medium">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="ispai" className="scroll-mt-24 border-t border-line pt-12 mt-12">
          <h2 className="font-display text-3xl tracking-tight">isPaid</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Other contracts ask this. Unknown invoices return false. True only after a matching
            remote payment has been verified and local value released.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-xs leading-relaxed text-fg">
            {ISPAID}
          </pre>
          <p className="mt-4 font-mono text-xs text-faint">{PAIDLINE_ADDRESS}</p>
        </section>

        <section id="x402" className="scroll-mt-24 border-t border-line pt-12 mt-12">
          <h2 className="font-display text-3xl tracking-tight">x402</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Drop this in front of a resource. Unpaid invoices return 402 with a pay URL. Paid
            invoices return 200. Retry after the stamp. No new Solidity.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-xs leading-relaxed text-fg">
            {GATE}
          </pre>
          <p className="mt-4">
            <Link to="/gate" className="text-sm underline decoration-line underline-offset-4">
              Try the gate
            </Link>
          </p>
        </section>

        <section id="source" className="scroll-mt-24 border-t border-line pt-12 mt-12">
          <h2 className="font-display text-3xl tracking-tight">Contract</h2>
          <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
            <Fact k="Paidline" v={PAIDLINE_ADDRESS} href={`${CREDITCOIN_EXPLORER}/address/${PAIDLINE_ADDRESS}`} />
            <Fact k="Deploy" v={PAIDLINE_DEPLOY_TX} href={`${CREDITCOIN_EXPLORER}/tx/${PAIDLINE_DEPLOY_TX}`} />
            <Fact k="Invoice chain" v={`${NETWORKS.creditcoin.name} ${NETWORKS.creditcoin.network}`} />
            <Fact k="Payment" v={`${NETWORKS.sepolia.tokenSymbol} on ${NETWORKS.sepolia.name} ${NETWORKS.sepolia.network}`} />
            <Fact k="USDC" v={USDC_SEPOLIA} href={`${SEPOLIA_EXPLORER}/token/${USDC_SEPOLIA}`} />
            <Fact k="Repo" v="github.com/Godwin-web3/paidline" href="https://github.com/Godwin-web3/paidline" />
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Public testnet. Demo value is not market value. You stay in control of the wallet.
            Paidline does not hold the USDC.
          </p>
        </section>
      </article>
      <div className="lg:col-span-2">
        <SiteFooter />
      </div>
    </div>
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
