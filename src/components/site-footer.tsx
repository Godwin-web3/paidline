import { Link } from "@tanstack/react-router";
import { CREDITCOIN_EXPLORER, PAIDLINE_ADDRESS } from "@/lib/paidline/constants";
import { Mark } from "@/components/mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-start gap-3">
            <Mark className="size-9 text-fg" />
            <div>
              <p className="font-display text-2xl tracking-tight">Paidline</p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted">
                First payment claims it. The contract is the only judge.
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <Link to="/board" className="hover:text-fg">
              Board
            </Link>
            <Link to="/invoices" className="hover:text-fg">
              Desk
            </Link>
            <Link to="/pay" className="hover:text-fg">
              Pay
            </Link>
            <Link to="/gate" className="hover:text-fg">
              Gate
            </Link>
            <Link to="/docs" className="hover:text-fg">
              Docs
            </Link>
          </nav>
        </div>
        <p className="break-all font-mono text-xs text-faint">{PAIDLINE_ADDRESS}</p>
      </div>
    </footer>
  );
}
