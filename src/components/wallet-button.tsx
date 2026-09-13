import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/paidline/session";
import { shortAddr } from "@/lib/utils";

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const address = useSession((s) => s.address);
  const error = useSession((s) => s.error);
  const connect = useSession((s) => s.connect);

  if (address) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-bg px-2.5 py-1.5">
        <span className="size-1.5 rounded-full bg-paid" aria-hidden />
        <span className="font-mono text-xs text-fg">{shortAddr(address, 4)}</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {error && !compact ? <span className="max-w-40 truncate text-xs text-bad">{error}</span> : null}
      <Button size="sm" variant="ghost" onClick={() => void connect()}>
        {compact ? "Connect" : "Connect wallet"}
      </Button>
    </span>
  );
}
