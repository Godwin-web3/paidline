import { Mark } from "@/components/mark";
import { cn } from "@/lib/utils";

export function ReceiptStamp({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex size-28 rotate-[-8deg] items-center justify-center text-paid",
        className,
      )}
      aria-hidden
    >
      <Mark className="size-28 text-paid" />
      <span className="absolute font-display text-sm tracking-wide uppercase">Paid</span>
    </div>
  );
}
