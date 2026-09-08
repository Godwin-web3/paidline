import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Wordmark } from "@/components/mark";
import { WalletButton } from "@/components/wallet-button";
import { useSession } from "@/lib/paidline/session";
import { cn } from "@/lib/utils";

const PUBLIC_NAV = [
  { to: "/how", label: "How" },
  { to: "/invoices", label: "Invoices" },
] as const;

const SELLER_NAV = [
  { to: "/invoices", label: "Invoices" },
  { to: "/new", label: "Issue" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrate = useSession((s) => s.hydrate);
  const buyer = pathname.startsWith("/pay/");
  const seller =
    pathname.startsWith("/invoices") || pathname.startsWith("/new") || pathname.startsWith("/invoice");
  const nav = seller ? SELLER_NAV : PUBLIC_NAV;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="grain" />
      <header className="relative z-10 border-b border-line bg-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" aria-label="Paidline home" className="min-h-11 inline-flex items-center">
            <Wordmark />
          </Link>
          {buyer ? (
            <p className="text-xs uppercase tracking-wide text-muted">Pay</p>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <nav className="flex flex-wrap items-center gap-1">
                {nav.map((item) => {
                  const active =
                    item.to === "/invoices"
                      ? pathname === "/invoices" || pathname.startsWith("/invoice/")
                      : pathname === item.to || pathname.startsWith(`${item.to}/`);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-md px-3 text-sm transition-colors duration-150",
                        active ? "bg-raised text-fg" : "text-muted hover:text-fg",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <WalletButton />
            </div>
          )}
        </div>
      </header>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
