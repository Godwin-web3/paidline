import { Link, useRouterState } from "@tanstack/react-router";
import { FileText, Plus, ShoppingBag, Code2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Mark, Wordmark } from "@/components/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import {
  CREDITCOIN_EXPLORER,
  PAIDLINE_ADDRESS,
} from "@/lib/paidline/constants";
import { useSession } from "@/lib/paidline/session";
import { useTheme } from "@/lib/theme";
import { cn, shortAddr } from "@/lib/utils";

const APP_NAV = [
  { to: "/pay", label: "Marketplace", icon: ShoppingBag },
  { to: "/invoices", label: "Your listings", icon: FileText },
  { to: "/new", label: "New listing", icon: Plus },
  { to: "/gate", label: "API", icon: Code2 },
] as const;

type Shell = "landing" | "docs" | "app" | "ticket";

function shellOf(pathname: string): Shell {
  if (pathname === "/" || pathname === "/board" || pathname === "/demo") return "landing";
  if (pathname.startsWith("/docs") || pathname.startsWith("/how") || pathname.startsWith("/source")) {
    return "docs";
  }
  if (pathname.startsWith("/pay/") || pathname.startsWith("/receipt/")) return "ticket";
  if (pathname.startsWith("/api/")) return "landing";
  return "app";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrate = useSession((s) => s.hydrate);
  const hydrateTheme = useTheme((s) => s.hydrate);
  const shell = shellOf(pathname);

  useEffect(() => {
    hydrate();
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  return (
    <div className={cn("min-h-dvh bg-bg text-fg", shell === "app" && "md:flex")}>
      {shell === "landing" ? <div className="grain" /> : null}
      {shell === "app" ? <AppSidebar pathname={pathname} /> : null}
      <div className={cn("relative z-10 min-w-0 flex-1", shell === "app" && "pb-16 md:pb-0")}>
        {shell === "landing" ? <LandingBar /> : null}
        {shell === "docs" ? <DocsBar /> : null}
        {shell === "ticket" ? <TicketBar pathname={pathname} /> : null}
        {shell === "app" ? <AppMobileBar /> : null}
        {children}
        {shell === "app" ? <AppTabBar pathname={pathname} /> : null}
      </div>
    </div>
  );
}

function LandingBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-2.5">
        <Link to="/" aria-label="Paidline home" className="inline-flex min-h-11 min-w-0 shrink items-center">
          <Wordmark compact />
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link
            to="/board"
            className="hidden min-h-11 items-center px-3 text-sm text-muted transition-colors duration-150 hover:text-fg sm:inline-flex"
          >
            Marketplace
          </Link>
          <a
            href="/#how"
            className="hidden min-h-11 items-center px-3 text-sm text-muted transition-colors duration-150 hover:text-fg sm:inline-flex"
          >
            How it works
          </a>
          <Link
            to="/docs"
            className="hidden min-h-11 items-center px-3 text-sm text-muted transition-colors duration-150 hover:text-fg md:inline-flex"
          >
            Docs
          </Link>
          <Link to="/pay">
            <span className="inline-flex min-h-10 items-center rounded-md bg-accent px-3 text-xs font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90 sm:min-h-11 sm:px-4 sm:text-sm">
              <span className="sm:hidden">Board</span>
              <span className="hidden sm:inline">Open marketplace</span>
            </span>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function DocsBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" aria-label="Paidline home" className="inline-flex min-h-11 shrink-0 items-center">
            <Wordmark compact />
          </Link>
          <span className="hidden rounded-full border border-line px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-muted sm:inline">
            Docs
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/board"
            className="hidden min-h-11 items-center px-3 text-sm text-muted hover:text-fg sm:inline-flex"
          >
            Marketplace
          </Link>
          <Link to="/pay">
            <span className="inline-flex min-h-10 items-center rounded-md bg-accent px-3 text-xs font-medium text-accent-fg sm:min-h-11 sm:px-4 sm:text-sm">
              <span className="sm:hidden">Board</span>
              <span className="hidden sm:inline">Open marketplace</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function TicketBar({ pathname }: { pathname: string }) {
  const receipt = pathname.startsWith("/receipt/");
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link to="/" aria-label="Paidline home" className="inline-flex min-h-11 items-center">
            <Mark className="size-7" />
          </Link>
          <p className="truncate text-sm text-muted">{receipt ? "Receipt" : "Checkout"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link
            to="/pay"
            className="inline-flex min-h-11 items-center px-2 text-sm text-muted hover:text-fg sm:px-3"
          >
            Listings
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function AppMobileBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface md:hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <Link to="/" aria-label="Paidline home" className="inline-flex items-center gap-2">
          <Wordmark compact />
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <WalletButton compact />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function AppTabBar({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden">
      <ul className="grid grid-cols-4">
        {APP_NAV.map((item) => {
          const active = isActive(item.to, pathname);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-fg" : "text-muted",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label === "Your listings" ? "Listings" : item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function isActive(to: (typeof APP_NAV)[number]["to"], pathname: string) {
  if (to === "/invoices") return pathname === "/invoices" || pathname.startsWith("/invoice/");
  if (to === "/pay") return pathname === "/pay" || pathname.startsWith("/pay/");
  if (to === "/gate") return pathname === "/gate" || pathname.startsWith("/gate/");
  return pathname === to;
}

function AppSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="sticky top-0 z-20 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="border-b border-line px-4 py-4">
        <Link to="/" aria-label="Paidline home" className="inline-flex min-h-11 items-center">
          <Wordmark compact />
        </Link>
      </div>
      <nav className="flex flex-col gap-1 px-2 py-3">
        {APP_NAV.map((item) => {
          const active = isActive(item.to, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "inline-flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150",
                active ? "bg-raised text-fg" : "text-muted hover:bg-raised/70 hover:text-fg",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-4 border-t border-line px-3 py-4">
        <div className="rounded-lg border border-line bg-bg px-3 py-3">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-faint">
            <span className="size-1.5 rounded-full bg-paid" aria-hidden />
            Live network
          </p>
          <p className="mt-2 text-xs text-muted">Creditcoin CC3 · USDC Sepolia</p>
          <a
            href={`${CREDITCOIN_EXPLORER}/address/${PAIDLINE_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block font-mono text-[11px] text-fg underline-offset-4 hover:underline"
          >
            {shortAddr(PAIDLINE_ADDRESS, 4)}
          </a>
        </div>
        <Link to="/docs" className="inline-flex min-h-10 items-center text-sm text-muted hover:text-fg">
          Documentation
        </Link>
        <WalletButton />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
