import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LOCAL_DECIMALS, SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { listOpen } from "@/lib/paidline/invoices";
import type { InvoiceWire } from "@/lib/paidline/types";
import { formatDue, formatUnits } from "@/lib/utils";

export function OpenBoard({ compact = false }: { compact?: boolean }) {
  const [invoices, setInvoices] = useState<InvoiceWire[] | null>(null);

  useEffect(() => {
    void listOpen()
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, []);

  if (invoices === null) {
    return <p className="text-sm text-muted">Reading the board…</p>;
  }

  if (invoices.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        Nothing open. The next funded invoice will land here. First payment claims it.
      </p>
    );
  }

  const rows = compact ? invoices.slice(0, 6) : invoices;

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {rows.map((inv) => (
        <li key={inv.id}>
          <Link
            to="/pay/$id"
            params={{ id: String(inv.id) }}
            className="grid gap-1 px-4 py-4 transition-colors duration-150 hover:bg-raised sm:grid-cols-[1fr_7rem_7rem_6rem] sm:items-center sm:gap-4"
          >
            <p className="min-w-0 truncate text-sm">
              <span className="font-mono text-xs text-muted">#{inv.id}</span>
              <span className="ml-2 font-medium">{inv.title}</span>
              {inv.releaseLabel ? (
                <span className="ml-2 hidden text-muted sm:inline">· {inv.releaseLabel}</span>
              ) : null}
            </p>
            <p className="font-mono text-sm tabular-nums sm:text-right">
              {formatUnits(BigInt(inv.sourceAmount), SOURCE_DECIMALS)} USDC
            </p>
            <p className="font-mono text-xs text-muted sm:text-right">
              {formatUnits(BigInt(inv.localAmount), LOCAL_DECIMALS)} tCTC
            </p>
            <p className="font-mono text-xs text-warn sm:text-right">{formatDue(inv.expiry)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
