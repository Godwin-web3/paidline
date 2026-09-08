import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { listSettled } from "@/lib/paidline/invoices";
import type { InvoiceWire } from "@/lib/paidline/types";
import { formatUnits, shortAddr } from "@/lib/utils";

export function SettledFeed() {
  const [invoices, setInvoices] = useState<InvoiceWire[] | null>(null);

  useEffect(() => {
    void listSettled()
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, []);

  if (invoices === null) {
    return <p className="text-sm text-muted">Reading stamps…</p>;
  }

  if (invoices.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        No stamps yet. The first matching USDC transfer will appear here. No wallet needed to
        watch.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
      {invoices.map((inv) => (
        <li key={inv.id}>
          <Link
            to="/receipt/$id"
            params={{ id: String(inv.id) }}
            className="grid gap-1 px-4 py-3.5 transition-colors duration-150 hover:bg-raised sm:grid-cols-[1fr_7rem_8rem] sm:items-center sm:gap-4"
          >
            <p className="min-w-0 truncate text-sm">
              <span className="font-mono text-xs text-muted">#{inv.id}</span>
              <span className="ml-2 font-medium">{inv.title}</span>
            </p>
            <p className="font-mono text-sm tabular-nums sm:text-right">
              {formatUnits(BigInt(inv.sourceAmount), SOURCE_DECIMALS)} USDC
            </p>
            <p className="font-mono text-xs text-paid sm:text-right">
              {inv.paidTxHash ? shortAddr(inv.paidTxHash, 4) : "Paid"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
