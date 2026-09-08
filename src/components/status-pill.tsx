import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/lib/paidline/types";

export function StatusPill({ status }: { status: InvoiceStatus; funded?: boolean }) {
  if (status === "paid") return <Badge tone="paid">Paid</Badge>;
  if (status === "cancelled") return <Badge tone="bad">Cancelled</Badge>;
  if (status === "expired") return <Badge tone="warn">Expired</Badge>;
  return <Badge tone="warn">Pending</Badge>;
}
