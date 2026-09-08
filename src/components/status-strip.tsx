import {
  CREDITCOIN_EXPLORER,
  NETWORKS,
  PAIDLINE_ADDRESS,
} from "@/lib/paidline/constants";
import { shortAddr } from "@/lib/utils";

export function StatusStrip({ address }: { address: string | null }) {
  const items = [
    { k: "Wallet", v: address ? shortAddr(address, 4) : "Not connected" },
    { k: "Invoice chain", v: `${NETWORKS.creditcoin.name} ${NETWORKS.creditcoin.network}` },
    { k: "Payment", v: `${NETWORKS.sepolia.tokenSymbol} on ${NETWORKS.sepolia.name}` },
    { k: "Contract", v: shortAddr(PAIDLINE_ADDRESS, 4) },
  ];

  return (
    <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.k} className="bg-surface px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-faint">{item.k}</p>
          <p className="mt-1 font-mono text-xs text-fg">{item.v}</p>
        </li>
      ))}
      <li className="sr-only">
        <a href={`${CREDITCOIN_EXPLORER}/address/${PAIDLINE_ADDRESS}`}>Contract</a>
      </li>
    </ul>
  );
}
