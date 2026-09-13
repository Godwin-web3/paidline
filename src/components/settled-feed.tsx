import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BoardSkeleton } from "@/components/skeleton";
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
    return <BoardSkeleton rows={3} />;
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-8">
        <p className="font-display text-xl tracking-tight">No settlements yet</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          When a listing is paid, it shows here with both explorer links. The board is live — the
          first matching USDC will stamp the first receipt.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
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
