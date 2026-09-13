import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function InvoiceSheet({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-paper text-ink shadow-sheet",
        className,
      )}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-ink" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply paper-tooth" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function SheetMeta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="font-sans text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}
