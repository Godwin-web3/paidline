import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("size-7 shrink-0 text-fg", className)}
    >
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="24.5" stroke="currentColor" strokeWidth="0.6" opacity="0.45" />
      <path d="M16 27.5h32" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
      <path d="M20 36.5h24" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
      <path d="M32 29.2 34.8 32 32 34.8 29.2 32Z" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-fg", className)}>
      <Mark className="size-8" />
      <span className="font-display text-xl leading-none tracking-tight">Paidline</span>
    </span>
  );
}
