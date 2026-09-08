import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      suppressHydrationWarning
      className={cn(
        "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm text-fg placeholder:text-faint",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        "font-mono",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  paper = false,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  paper?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span
        className={cn(
          "text-xs font-medium uppercase tracking-wide",
          paper ? "text-ink-muted" : "text-muted",
        )}
      >
        {label}
      </span>
      {children}
      {hint ? (
        <span className={cn("text-xs", paper ? "text-ink-muted" : "text-faint")}>{hint}</span>
      ) : null}
    </label>
  );
}
