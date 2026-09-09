import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  children,
  action,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker ? <p className="text-xs uppercase tracking-wide text-muted">{kicker}</p> : null}
        <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
        {children ? (
          <div className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
