import { createFileRoute, Link } from "@tanstack/react-router";
import { InvoiceSheet, SheetMeta } from "@/components/invoice-sheet";
import { ReceiptStamp } from "@/components/receipt-stamp";
import { Button } from "@/components/ui/button";
import {
  CREDITCOIN_EXPLORER,
  SEPOLIA_EXPLORER,
  SOURCE_DECIMALS,
} from "@/lib/paidline/constants";
import { getInvoice } from "@/lib/paidline/invoices";
import { formatUnits, shortAddr } from "@/lib/utils";

export const Route = createFileRoute("/receipt/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) return null;
    return getInvoice({ data: { id } });
  },
  component: ReceiptPage,
});

function ReceiptPage() {
  const invoice = Route.useLoaderData();
  const { id } = Route.useParams();

  if (!invoice) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-3xl">No receipt</h1>
        <p className="mt-2 text-sm text-muted">Nothing at invoice #{id}.</p>
      </main>
    );
  }

  if (invoice.status !== "paid") {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-display text-3xl tracking-tight">Not stamped</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Invoice #{invoice.id} is {invoice.status}. The receipt exists only after the contract
          matches the USDC transfer.
        </p>
        <Link to="/pay/$id" params={{ id: String(invoice.id) }} className="mt-6 inline-block">
          <Button>Open payment</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-4 text-xs uppercase tracking-wide text-muted">Receipt</p>
      <InvoiceSheet className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Invoice #{invoice.id}</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">{invoice.title}</h1>
          </div>
          <ReceiptStamp />
        </div>
        <dl className="mt-8 grid gap-5">
          <SheetMeta label="Amount">
            <span className="font-display text-4xl tabular-nums tracking-tight">
              {formatUnits(BigInt(invoice.sourceAmount), SOURCE_DECIMALS)} USDC
            </span>
          </SheetMeta>
          <SheetMeta label="Released">{invoice.releaseLabel}</SheetMeta>
          {invoice.paidTxHash ? (
            <SheetMeta label="Ethereum transfer">
              <a
                className="font-mono text-xs underline underline-offset-4"
                href={`${SEPOLIA_EXPLORER}/tx/${invoice.paidTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                {shortAddr(invoice.paidTxHash, 8)}
              </a>
            </SheetMeta>
          ) : null}
          {invoice.stampTxHash ? (
            <SheetMeta label="Creditcoin stamp">
              <a
                className="font-mono text-xs underline underline-offset-4"
                href={`${CREDITCOIN_EXPLORER}/tx/${invoice.stampTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                {shortAddr(invoice.stampTxHash, 8)}
              </a>
            </SheetMeta>
          ) : null}
          <SheetMeta label="Merchant">
            <a
              className="break-all font-mono text-xs underline underline-offset-4"
              href={`${CREDITCOIN_EXPLORER}/address/${invoice.merchant}`}
              target="_blank"
              rel="noreferrer"
            >
              {shortAddr(invoice.merchant, 6)}
            </a>
          </SheetMeta>
        </dl>
        <p className="mt-8 text-sm leading-relaxed text-ink-muted">
          The contract marked this paid. No company in the middle confirmed it.
        </p>
      </InvoiceSheet>
    </main>
  );
}
