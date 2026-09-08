import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { StatusPill } from "@/components/status-pill";
import type { InvoiceStatus } from "@/lib/paidline/types";
import { cn } from "@/lib/utils";

export function PaperSlip({
  id,
  title,
  amount,
  status,
  meta,
  to,
  specimen,
}: {
  id: string;
  title: string;
  amount: string;
  status?: InvoiceStatus;
  meta?: ReactNode;
  to?: "/invoice/$id";
  specimen?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            {specimen ? "Specimen" : `Invoice #${id}`}
          </p>
          <p className="mt-1 truncate font-display text-xl tracking-tight text-ink">{title}</p>
        </div>
        {status ? <StatusPill status={status} /> : null}
      </div>
      <p className="mt-4 font-display text-3xl tabular-nums tracking-tight text-ink">
        {amount}
        <span className="ml-2 text-base text-ink-muted">USDC</span>
      </p>
      {meta ? <p className="mt-3 font-mono text-xs text-ink-muted">{meta}</p> : null}
    </>
  );

  const cls = cn(
    "relative block overflow-hidden rounded-xl bg-paper p-5 text-left text-ink shadow-sheet",
    to && "transition-transform duration-150 hover:-translate-y-0.5",
  );

  const tooth = (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply paper-tooth"
    />
  );

  if (to) {
    return (
      <Link to={to} params={{ id }} className={cls}>
        {tooth}
        <div className="relative">{inner}</div>
      </Link>
    );
  }

  return (
    <div className={cls}>
      {tooth}
      <div className="relative">{inner}</div>
    </div>
  );
}
