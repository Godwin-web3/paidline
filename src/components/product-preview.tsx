import { Check } from "lucide-react";

export function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sheet">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-muted">Invoice #4821</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-paid/35 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-paid">
          <Check className="size-3" strokeWidth={2.5} />
          Paid
        </span>
      </div>
      <div className="bg-paper px-5 py-6 text-ink sm:px-6 sm:py-7">
        <p className="text-[11px] uppercase tracking-wide text-ink-muted">September retainer</p>
        <p className="mt-2 font-display text-4xl tabular-nums tracking-tight sm:text-5xl">
          250.00
          <span className="ml-2 text-lg text-ink-muted">USDC</span>
        </p>
        <dl className="mt-6 grid gap-4 border-t border-rule pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Chain</dt>
            <dd>Ethereum</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Token</dt>
            <dd>USDC</dd>
          </div>
          <div className="flex min-w-0 justify-between gap-4">
            <dt className="shrink-0 text-ink-muted">Destination</dt>
            <dd className="truncate font-mono text-xs">0x6e88…a2c7</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Release</dt>
            <dd>Locked Creditcoin</dd>
          </div>
        </dl>
      </div>
      <div className="grid grid-cols-2 divide-x divide-line border-t border-line text-xs">
        <div className="px-4 py-3">
          <p className="uppercase tracking-wide text-faint">Source</p>
          <p className="mt-1 font-mono text-muted">0x4f91…c12a</p>
        </div>
        <div className="px-4 py-3">
          <p className="uppercase tracking-wide text-faint">Checked by</p>
          <p className="mt-1 text-fg">The contract</p>
        </div>
      </div>
    </div>
  );
}
