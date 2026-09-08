import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: "muted" | "paid" | "warn" | "bad" | "live";
  className?: string;
}) {
  const tones = {
    muted: "text-muted border-line",
    paid: "text-paid border-paid/30",
    warn: "text-warn border-warn/30",
    bad: "text-bad border-bad/30",
    live: "text-fg border-line-strong",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
