import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { getGate, type GateBody } from "@/lib/paidline/invoices";
import { formatUnits } from "@/lib/utils";

export const Route = createFileRoute("/gate/$id")({ component: GatePage });

function GatePage() {
  const { id } = Route.useParams();
  const invoiceId = Number(id);
  const [http, setHttp] = useState<number | null>(null);
  const [body, setBody] = useState<GateBody | null>(null);
  const [raw, setRaw] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    void getGate({ data: { id: invoiceId, origin } }).then((res) => {
      setHttp(res.status);
      setBody(res.body);
    });
    void fetch(`/api/gate/${invoiceId}`)
      .then(async (r) => {
        setHttp(r.status);
        const text = await r.text();
        setRaw(text);
        try {
          setBody(JSON.parse(text) as GateBody);
        } catch {
          /* keep raw */
        }
      })
      .catch(() => {});
  }, [invoiceId]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs uppercase tracking-wide text-muted">API</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">GET /api/gate/{id}</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Unpaid listings return 402. Paid listings return 200. The body is JSON. Paidline does not
        serve the work until the contract says it is paid.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-mono text-xs text-muted">Response</p>
          <p className="font-mono text-sm">
            {http === null ? "…" : http === 200 ? "200 OK" : http === 402 ? "402 Payment Required" : String(http)}
          </p>
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg">
          {raw || (body ? JSON.stringify(body, null, 2) : "Calling gate…")}
        </pre>
      </div>

      {body && "x402" in body ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/pay/$id" params={{ id: String(invoiceId) }}>
            <Button>Pay listing #{invoiceId}</Button>
          </Link>
          {body.amount ? (
            <p className="self-center text-sm text-muted">
              {formatUnits(BigInt(body.amount), SOURCE_DECIMALS)} USDC due
            </p>
          ) : null}
        </div>
      ) : null}

      {body && "ok" in body ? (
        <div className="mt-6 rounded-xl border border-paid/30 bg-raised p-5">
          <p className="text-sm text-paid">Access granted</p>
          <p className="mt-2 font-display text-2xl tracking-tight">{body.title}</p>
          <p className="mt-2 text-sm text-muted">{body.release}</p>
          <Link
            to="/receipt/$id"
            params={{ id: String(invoiceId) }}
            className="mt-4 inline-block text-sm underline decoration-line underline-offset-4"
          >
            Open the receipt
          </Link>
        </div>
      ) : null}
    </main>
  );
}
