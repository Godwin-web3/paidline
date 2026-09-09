import { cn } from "@/lib/utils";

export function ProductFrame({
  url,
  children,
  className,
}: {
  url: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-surface shadow-sheet",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <p className="ml-2 truncate font-mono text-[11px] text-faint">{url}</p>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}
