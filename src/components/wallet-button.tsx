import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/paidline/session";
import { shortAddr } from "@/lib/utils";

export function WalletButton() {
  const address = useSession((s) => s.address);
  const error = useSession((s) => s.error);
  const connect = useSession((s) => s.connect);

  if (address) {
    return <span className="font-mono text-xs text-muted">{shortAddr(address, 4)}</span>;
  }

  return (
    <span className="flex items-center gap-2">
      {error ? <span className="max-w-40 truncate text-xs text-bad">{error}</span> : null}
      <Button size="sm" variant="ghost" onClick={() => void connect()}>
        Connect wallet
      </Button>
    </span>
  );
}
