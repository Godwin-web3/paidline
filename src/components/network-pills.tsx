import {
  CREDITCOIN_EXPLORER,
  PAIDLINE_ADDRESS,
} from "@/lib/paidline/constants";
import { shortAddr } from "@/lib/utils";

export function NetworkPills({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      <li className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
        <span className="size-1.5 rounded-full bg-paid" aria-hidden />
        Creditcoin CC3
      </li>
      <li className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
        USDC on Ethereum Sepolia
      </li>
      <li>
        <a
          href={`${CREDITCOIN_EXPLORER}/address/${PAIDLINE_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          {shortAddr(PAIDLINE_ADDRESS, 4)}
          <span className="text-[10px] uppercase tracking-wide text-paid">Verified</span>
        </a>
      </li>
    </ul>
  );
}
