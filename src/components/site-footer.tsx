import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Mark } from "@/components/mark";
import {
  CREDITCOIN_EXPLORER,
  PAIDLINE_ADDRESS,
} from "@/lib/paidline/constants";
import { shortAddr } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex items-start gap-3">
          <Mark className="size-9 text-fg" />
          <div>
            <p className="font-display text-2xl tracking-tight">Paidline</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
              Public marketplace. Pay USDC on Ethereum. Creditcoin confirms it. First match wins.
            </p>
          </div>
        </div>
        <FooterCol title="Product">
          <Link to="/pay">Marketplace</Link>
          <Link to="/new">Create a listing</Link>
          <Link to="/gate">x402 API</Link>
          <Link to="/demo">Demo</Link>
        </FooterCol>
        <FooterCol title="Protocol">
          <Link to="/docs">Docs</Link>
          <a href="/#how">How it works</a>
          <a href="https://github.com/Godwin-web3/paidline" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </FooterCol>
        <FooterCol title="Network">
          <a
            href={`${CREDITCOIN_EXPLORER}/address/${PAIDLINE_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            {shortAddr(PAIDLINE_ADDRESS, 4)}
          </a>
          <span className="text-muted">CC3 testnet · 102031</span>
          <span className="text-muted">USDC Sepolia</span>
        </FooterCol>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">{title}</p>
      <div className="mt-4 flex flex-col gap-2.5 text-sm text-muted [&>a:hover]:text-fg">{children}</div>
    </div>
  );
}
