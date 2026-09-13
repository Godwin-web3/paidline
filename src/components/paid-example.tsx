import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getInvoice } from "@/lib/paidline/invoices";
import type { InvoiceWire } from "@/lib/paidline/types";
import { SOURCE_DECIMALS } from "@/lib/paidline/constants";
import { formatUnits } from "@/lib/utils";

const WALKTHROUGH_ID = 9;

export function PaidExample() {
  const [invoice, setInvoice] = useState<InvoiceWire | null | undefined>(undefined);

  useEffect(() => {
    void getInvoice({ data: { id: WALKTHROUGH_ID } })
      .then((row) => setInvoice(row))
      .catch(() => setInvoice(null));
  }, []);

  if (invoice === undefined) {
    return (
      <div className="mt-6 h-[5.5rem] animate-pulse rounded-xl border border-line bg-raised sm:mt-8" />
    );
  }
  if (!invoice) return null;

  const paid = invoice.status === "paid";
  const amount = formatUnits(BigInt(invoice.sourceAmount), SOURCE_DECIMALS);

  return (
    <Link
      to="/pay/$id"
      params={{ id: String(invoice.id) }}
      className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-raised px-4 py-3.5 sm:mt-8"
      style={paid ? { borderColor: "color-mix(in oklab, var(--color-paid) 45%, var(--color-line))" } : undefined}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] uppercase tracking-wide ${paid ? "text-paid" : "text-faint"}`}>
          {paid ? "Already paid" : `${amount} USDC walkthrough`}
        </p>
        <p className="mt-1 text-sm font-medium leading-snug">
          #{invoice.id} · {invoice.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {paid
            ? "The contract stamped this one. Open it and read the work."
            : "Send the exact USDC on Sepolia. Checkout unlocks the brief."}
        </p>
      </div>
      <ArrowRight
        className={`mt-1 size-4 shrink-0 ${paid ? "text-paid" : "text-faint"}`}
        strokeWidth={1.75}
      />
    </Link>
  );
}
