import { Link, useRouterState } from "@tanstack/react-router";
import { FileText, Plus, Search, Shield } from "lucide-react";
import { useEffect } from "react";
import { Mark, Wordmark } from "@/components/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import { useSession } from "@/lib/paidline/session";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const DESK_NAV = [
  { to: "/invoices", label: "Blotter", icon: FileText },
  { to: "/new", label: "Issue", icon: Plus },
  { to: "/pay", label: "Pay", icon: Search },
  { to: "/gate", label: "Gate", icon: Shield },
] as const;

type Shell = "landing" | "docs" | "desk" | "ticket";

function shellOf(pathname: string): Shell {
  if (pathname === "/") return "landing";
  if (pathname.startsWith("/docs") || pathname.startsWith("/how") || pathname.startsWith("/source")) {
    return "docs";
  }
  if (pathname.startsWith("/pay/") || pathname.startsWith("/receipt/")) return "ticket";
  if (pathname.startsWith("/api/")) return "landing";
  return "desk";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrate = useSession((s) => s.hydrate);
  const hydrateTheme = useTheme((s) => s.hydrate);
  const shell = shellOf(pathname);

  useEffect(() => {
    hydrate();
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  return (
    <div className={cn("min-h-dvh bg-bg text-fg", shell === "desk" && "md:flex")}>
      {shell === "landing" ? <div className="grain" /> : null}
      {shell === "desk" ? <DeskSidebar pathname={pathname} /> : null}
      <div className={cn("relative z-10 min-w-0 flex-1", shell === "desk" && "pb-16 md:pb-0")}>
        {shell === "landing" ? <LandingBar /> : null}
        {shell === "docs" ? <DocsBar /> : null}
        {shell === "ticket" ? <TicketBar pathname={pathname} /> : null}
        {shell === "desk" ? <DeskMobileBar /> : null}
        {children}
        {shell === "desk" ? <DeskTabBar pathname={pathname} /> : null}
      </div>
    </div>
  );
}

function LandingBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link to="/" aria-label="Paidline home" className="inline-flex min-h-11 shrink-0 items-center">
          <Wordmark compact />
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/docs"
            className="inline-flex min-h-11 items-center px-3 text-sm text-muted transition-colors duration-150 hover:text-fg"
          >
            Docs
          </Link>
          <Link to="/invoices">
            <span className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90">
              Open desk
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function DocsBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
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
            to="/"
            className="inline-flex min-h-11 items-center px-3 text-sm text-muted transition-colors duration-150 hover:text-fg"
          >
            Home
          </Link>
          <Link to="/invoices">
            <span className="inline-flex min-h-11 items-center rounded-md border border-line px-3 text-sm text-fg hover:bg-raised">
              Open desk
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
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Paidline home" className="inline-flex min-h-11 items-center">
            <Mark className="size-7" />
          </Link>
          <p className="text-xs uppercase tracking-wide text-muted">{receipt ? "Receipt" : "Pay"}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/invoices"
            className="inline-flex min-h-11 items-center px-3 text-sm text-muted hover:text-fg"
          >
            Desk
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function DeskMobileBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface md:hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <Link to="/" aria-label="Paidline home" className="inline-flex items-center gap-2">
          <Mark className="size-7" />
          <span className="text-[11px] uppercase tracking-wide text-faint">Desk</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <WalletButton compact />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function DeskTabBar({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden">
      <ul className="grid grid-cols-4">
        {DESK_NAV.map((item) => {
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
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function isActive(to: (typeof DESK_NAV)[number]["to"], pathname: string) {
  if (to === "/invoices") return pathname === "/invoices" || pathname.startsWith("/invoice/");
  if (to === "/pay") return pathname === "/pay" || pathname.startsWith("/pay/");
  if (to === "/gate") return pathname === "/gate" || pathname.startsWith("/gate/");
  return pathname === to;
}

function DeskSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="sticky top-0 z-20 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="border-b border-line px-4 py-4">
        <Link to="/" aria-label="Paidline home" className="inline-flex min-h-11 items-center">
          <Wordmark compact />
        </Link>
        <p className="mt-3 text-[11px] uppercase tracking-wide text-faint">Desk</p>
        <Link
          to="/"
          className="mt-1 inline-flex min-h-10 items-center text-sm text-muted hover:text-fg"
        >
          ← Site
        </Link>
      </div>
      <nav className="flex flex-col gap-1 px-2 py-3">
        {DESK_NAV.map((item) => {
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
      <div className="mt-auto border-t border-line px-3 py-4">
        <Link
          to="/docs"
          className="mb-3 inline-flex min-h-10 items-center text-sm text-muted hover:text-fg"
        >
          Docs
        </Link>
        <WalletButton />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
