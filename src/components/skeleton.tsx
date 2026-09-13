import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-raised", className)} />;
}

export function BoardSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_7rem_6rem]">
          <div className="grid gap-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="hidden h-4 w-16 justify-self-end sm:block" />
          <Skeleton className="hidden h-3 w-12 justify-self-end sm:block" />
        </li>
      ))}
    </ul>
  );
}

export function SheetSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-10 w-3/4" />
      <Skeleton className="mt-8 h-16 w-40" />
      <Skeleton className="mt-6 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </div>
  );
}
