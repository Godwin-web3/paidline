import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { listSettled } from "@/lib/paidline/invoices";
import { PAIDLINE_ADDRESS, SOURCE_DECIMALS } from "@/lib/paidline/constants";
import type { InvoiceWire } from "@/lib/paidline/types";
import { formatUnits, shortAddr } from "@/lib/utils";

export function ProductPreview() {
  const [invoice, setInvoice] = useState<InvoiceWire | null | undefined>(undefined);

  useEffect(() => {
    void listSettled()
      .then((rows) => {
        const withWork = rows.find((row) => row.hasWork) ?? rows[0] ?? null;
        setInvoice(withWork);
      })
      .catch(() => setInvoice(null));
  }, []);

  if (invoice === undefined) {
    return <div className="h-72 animate-pulse rounded-xl border border-line bg-surface" />;
  }

  if (!invoice) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-6 sm:px-5">
        <p className="text-[11px] uppercase tracking-wide text-muted">Receipt</p>
        <p className="mt-2 font-display text-xl tracking-tight sm:text-2xl">Nothing stamped yet.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          After Attestcoin verifies a Sepolia transfer, the listing’s receipt lands here.
        </p>
        <Link
          to="/pay/$id"
          params={{ id: "9" }}
          className="mt-4 inline-flex min-h-11 items-center text-sm underline decoration-line underline-offset-4"
        >
          Open the 10 USDC walkthrough
        </Link>
      </div>
    );
  }

  const amount = formatUnits(BigInt(invoice.sourceAmount), SOURCE_DECIMALS);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sheet">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-muted">Listing #{invoice.id}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-paid/35 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-paid">
          <Check className="size-3" strokeWidth={2.5} />
          Paid
        </span>
      </div>
      <div className="bg-paper px-4 py-5 text-ink sm:px-6 sm:py-7">
        <p className="text-[11px] uppercase tracking-wide text-ink-muted">{invoice.title}</p>
        <p className="mt-2 font-display text-3xl tabular-nums tracking-tight sm:text-5xl">
          {amount}
          <span className="ml-2 text-base text-ink-muted sm:text-lg">USDC</span>
        </p>
        <dl className="mt-5 grid gap-3 border-t border-rule pt-4 text-sm sm:mt-6 sm:gap-4 sm:pt-5">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Chain</dt>
            <dd>Ethereum Sepolia</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Token</dt>
            <dd>USDC</dd>
          </div>
          <div className="flex min-w-0 justify-between gap-4">
            <dt className="shrink-0 text-ink-muted">Work</dt>
            <dd className="text-right">{invoice.hasWork ? "Unlocked on checkout" : "None attached"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Checked by</dt>
            <dd className="truncate font-mono text-xs">{shortAddr(PAIDLINE_ADDRESS, 4)}</dd>
          </div>
        </dl>
      </div>
      <div className="grid grid-cols-2 divide-x divide-line border-t border-line text-xs">
        <div className="px-4 py-3">
          <p className="uppercase tracking-wide text-faint">Source</p>
          <p className="mt-1 text-muted">Sepolia transfer</p>
        </div>
        <div className="px-4 py-3">
          <p className="uppercase tracking-wide text-faint">Stamp</p>
          <p className="mt-1 text-fg">Creditcoin · isPaid</p>
        </div>
      </div>
    </div>
  );
}
