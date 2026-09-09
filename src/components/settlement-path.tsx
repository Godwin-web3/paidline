import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type DeskPhase = "connect" | "issue" | "pay" | "done";

const STEPS = [
  {
    n: "1",
    t: "List",
    d: "Publish on Creditcoin. It appears on the marketplace.",
  },
  {
    n: "2",
    t: "Pay",
    d: "A buyer sends the exact USDC on Ethereum.",
  },
  {
    n: "3",
    t: "Confirm",
    d: "The contract matches the transfer. Open becomes paid.",
  },
] as const;

export function SettlementPath({
  phase,
  pendingId,
}: {
  phase: DeskPhase;
  pendingId?: number;
}) {
  const current =
    phase === "connect" || phase === "issue" ? 0 : phase === "pay" ? 1 : 2;

  return (
    <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
      {STEPS.map((step, i) => {
        const on = i === current;
        const done = i < current;
        return (
          <li key={step.n} className={cn("bg-surface p-5 sm:p-6", on && "bg-raised")}>
            <p className="font-mono text-xs text-faint">
              {step.n}
              {done ? " · done" : on ? " · now" : ""}
            </p>
            <h3 className="mt-2 font-display text-2xl tracking-tight">{step.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.d}</p>
            {on && i === 0 ? (
              <Link
                to="/new"
                className="mt-4 inline-block text-sm underline decoration-line underline-offset-4"
              >
                Create a listing
              </Link>
            ) : null}
            {on && i === 1 && pendingId ? (
              <Link
                to="/pay/$id"
                params={{ id: String(pendingId) }}
                className="mt-4 inline-block text-sm underline decoration-line underline-offset-4"
              >
                Open listing #{pendingId}
              </Link>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
