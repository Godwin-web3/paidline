import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, FileText, Plus, Search } from "lucide-react";
import { useEffect } from "react";
import { Mark, Wordmark } from "@/components/mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import { useSession } from "@/lib/paidline/session";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const WORK_NAV = [
  { to: "/invoices", label: "Blotter", icon: FileText },
  { to: "/new", label: "Issue", icon: Plus },
  { to: "/pay", label: "Pay", icon: Search },
  { to: "/how", label: "How", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrate = useSession((s) => s.hydrate);
  const hydrateTheme = useTheme((s) => s.hydrate);
  const buyer = pathname.startsWith("/pay/");
  const work =
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/new") ||
    pathname.startsWith("/invoice") ||
    pathname === "/pay" ||
    pathname.startsWith("/how");
  const story = pathname === "/";

  useEffect(() => {
    hydrate();
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  return (
    <div className={cn("min-h-dvh bg-bg text-fg", work && "md:flex")}>
      {story ? <div className="grain" /> : null}
      {work ? <WorkSidebar pathname={pathname} /> : null}
      <div className="relative z-10 min-w-0 flex-1">
        {buyer ? (
          <TopBar compact>
            <p className="px-2 text-xs uppercase tracking-wide text-muted">Pay</p>
            <ThemeToggle />
          </TopBar>
        ) : null}
        {story ? (
          <TopBar>
            <nav className="flex flex-wrap items-center gap-1">
              <a
                href="/#product"
                className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted transition-colors duration-150 hover:text-fg"
              >
                Product
              </a>
              <NavLink to="/how" active={pathname.startsWith("/how")}>
                How
              </NavLink>
              <NavLink to="/invoices" active={false}>
                Workspace
              </NavLink>
            </nav>
            <Link to="/new">
              <ButtonGhost>Issue</ButtonGhost>
            </Link>
            <ThemeToggle />
          </TopBar>
        ) : null}
        {work ? (
          <header className="relative z-10 border-b border-line bg-bg md:hidden">
            <div className="flex min-w-0 items-center gap-2 px-3 py-2">
              <Link to="/" aria-label="Paidline home" className="shrink-0">
                <Mark className="size-7" />
              </Link>
              <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
                {WORK_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    active={isActive(item.to, pathname)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="flex shrink-0 items-center gap-1">
                <WalletButton compact />
                <ThemeToggle />
              </div>
            </div>
          </header>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function isActive(to: (typeof WORK_NAV)[number]["to"], pathname: string) {
  if (to === "/invoices") return pathname === "/invoices" || pathname.startsWith("/invoice/");
  if (to === "/pay") return pathname === "/pay" || pathname.startsWith("/pay/");
  if (to === "/how") return pathname.startsWith("/how");
  return pathname === to;
}

function WorkSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="sticky top-0 z-20 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <Link to="/" aria-label="Paidline home" className="flex min-h-14 items-center px-4">
        <Wordmark compact />
      </Link>
      <p className="px-4 pb-3 text-[11px] uppercase tracking-wide text-faint">Desk</p>
      <nav className="flex flex-col gap-1 px-2">
        {WORK_NAV.map((item) => {
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
        <WalletButton />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

function TopBar({
  children,
  compact,
  className,
}: {
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("relative z-10 border-b border-line bg-bg", className)}>
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6",
          compact ? "py-2.5" : "py-4",
        )}
      >
        <Link to="/" aria-label="Paidline home" className="inline-flex min-h-11 items-center">
          <Wordmark compact={compact} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">{children}</div>
      </div>
    </header>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: "/how" | "/invoices" | "/new" | "/pay";
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex min-h-11 items-center rounded-md px-2.5 text-sm whitespace-nowrap transition-colors duration-150 sm:px-3",
        active ? "bg-raised text-fg" : "text-muted hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}

function ButtonGhost({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-11 items-center rounded-md border border-line px-3 text-sm text-fg transition-colors duration-150 hover:bg-raised">
      {children}
    </span>
  );
}
