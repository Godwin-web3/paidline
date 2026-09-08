import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Wordmark } from "@/components/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import { useSession } from "@/lib/paidline/session";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const STORY_NAV = [{ to: "/how", label: "How" }] as const;

const WORK_NAV = [
  { to: "/invoices", label: "Invoices" },
  { to: "/new", label: "Issue" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrate = useSession((s) => s.hydrate);
  const hydrateTheme = useTheme((s) => s.hydrate);
  const buyer = pathname.startsWith("/pay/");
  const work =
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/new") ||
    pathname.startsWith("/invoice");
  const story = pathname === "/" || pathname.startsWith("/how");

  useEffect(() => {
    hydrate();
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      {story ? <div className="grain" /> : null}
      <header
        className={cn(
          "relative z-10 border-b",
          work || buyer ? "border-line bg-surface" : "border-line/70 bg-bg",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6",
            work || buyer ? "py-2.5" : "py-4",
          )}
        >
          <Link to="/" aria-label="Paidline home" className="min-h-11 inline-flex items-center">
            <Wordmark compact={work || buyer} />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {buyer ? (
              <p className="px-2 text-xs uppercase tracking-wide text-muted">Pay</p>
            ) : (
              <>
                <nav className="flex flex-wrap items-center gap-1">
                  {(work ? WORK_NAV : STORY_NAV).map((item) => {
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
                  {story ? (
                    <Link
                      to="/invoices"
                      className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted transition-colors duration-150 hover:text-fg"
                    >
                      Workspace
                    </Link>
                  ) : null}
                </nav>
                {work ? <WalletButton /> : null}
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
