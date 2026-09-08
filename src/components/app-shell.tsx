import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { WalletButton } from "@/components/wallet-button";
import { useSession } from "@/lib/paidline/session";
import { cn } from "@/lib/utils";

const PUBLIC_NAV = [
  { to: "/how", label: "How" },
  { to: "/invoices", label: "Invoices" },
] as const;

const SELLER_NAV = [
  { to: "/invoices", label: "Invoices" },
  { to: "/new", label: "New" },
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
      <header className="relative z-10 border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:max-w-5xl sm:px-6">
          <Link to="/" className="font-display text-xl tracking-tight">
            Paidline
          </Link>
          {buyer ? (
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Pay</p>
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
                        "rounded-[10px] px-3 py-2 text-sm transition-colors duration-150",
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
