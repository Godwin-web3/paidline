import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BoardSkeleton } from "@/components/skeleton";
import { LOCAL_DECIMALS, SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { listOpen } from "@/lib/paidline/invoices";
import type { InvoiceWire } from "@/lib/paidline/types";
import { formatDue, formatUnits, shortAddr } from "@/lib/utils";

export function OpenBoard({
  compact = false,
  searchable = false,
}: {
  compact?: boolean;
  searchable?: boolean;
}) {
  const [invoices, setInvoices] = useState<InvoiceWire[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void listOpen()
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, []);

  const filtered = useMemo(() => {
    if (!invoices) return [];
    const q = query.trim().toLowerCase();
    const rows = compact ? invoices.slice(0, 3) : invoices;
    if (!q) return rows;
    return rows.filter(
      (inv) =>
        inv.title.toLowerCase().includes(q) ||
        inv.releaseLabel.toLowerCase().includes(q) ||
        String(inv.id) === q,
    );
  }, [compact, invoices, query]);

  if (invoices === null) {
    return <BoardSkeleton rows={compact ? 3 : 6} />;
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-8">
        <p className="font-display text-xl tracking-tight">Nothing for sale right now</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          The next listing appears here the moment it is funded. First matching USDC claims it.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div>
        <ul className="grid gap-3">
          {filtered.map((inv) => (
            <li key={inv.id}>
              <Link
                to="/pay/$id"
                params={{ id: String(inv.id) }}
                className="group flex items-start justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong hover:bg-raised"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{inv.title}</p>
                  <p className="mt-1 truncate text-xs text-muted">{inv.releaseLabel}</p>
                </div>
                <p className="shrink-0 font-display text-xl tabular-nums tracking-tight">
                  {formatUnits(BigInt(inv.sourceAmount), SOURCE_DECIMALS)}
                  <span className="ml-1 text-xs text-muted">USDC</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/pay"
          className="mt-3 inline-flex min-h-10 items-center text-sm text-muted underline decoration-line underline-offset-4 hover:text-fg"
        >
          {invoices.length} live listing{invoices.length === 1 ? "" : "s"} on the marketplace
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          <span className="font-medium text-fg">{invoices.length} open</span>
          <span className="mx-2 text-faint">·</span>
          USDC on Ethereum Sepolia
        </p>
        {searchable ? (
          <label className="relative block sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search listings"
              className="h-11 w-full rounded-md border border-line bg-bg pl-10 pr-3 text-sm text-fg placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            />
          </label>
        ) : null}
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-6 text-sm text-muted">
          No listing matches “{query.trim()}”.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {filtered.map((inv) => (
            <li key={inv.id}>
              <Link
                to="/pay/$id"
                params={{ id: String(inv.id) }}
                className="grid gap-2 px-4 py-4 transition-colors duration-150 hover:bg-raised sm:grid-cols-[minmax(0,1fr)_8.5rem_5.5rem] sm:items-center sm:gap-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <span className="font-mono text-xs text-faint">#{inv.id}</span>
                    <span className="ml-2">{inv.title}</span>
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {inv.releaseLabel}
                    <span className="mx-1.5 text-faint">·</span>
                    {shortAddr(inv.sourceRecipient, 4)}
                  </p>
                </div>
                <p className="font-display text-2xl tabular-nums tracking-tight sm:text-right">
                  {formatUnits(BigInt(inv.sourceAmount), SOURCE_DECIMALS)}
                  <span className="ml-1.5 font-sans text-xs font-normal text-muted">USDC</span>
                </p>
                <div className="flex items-center gap-3 text-xs text-muted sm:flex-col sm:items-end sm:gap-1">
                  <span className="font-mono">
                    {formatUnits(BigInt(inv.localAmount), LOCAL_DECIMALS)} tCTC
                  </span>
                  <span className="rounded-full border border-warn/30 px-2 py-0.5 font-mono text-warn">
                    {formatDue(inv.expiry)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
