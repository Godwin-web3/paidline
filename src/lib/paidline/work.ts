import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { isAddress } from "@/lib/utils";
import { readInvoice } from "./chain.ts";
import { normalizeWork, type WorkPayload } from "./work-format.ts";

export type { WorkKind, WorkPayload } from "./work-format.ts";
export {
  MAX_WORK_CHARS,
  MIN_WORK_CHARS,
  classifyWork,
  normalizeWork,
  pickDust,
  uniqueExactUsdc,
  workVisibleToBuyer,
} from "./work-format.ts";

/**
 * Demo deliverables for the eight live CC3 listings. Judges click these.
 * The HTTP gate and checkout still refuse the body until the contract says paid.
 */
const SEED_WORK: Record<number, WorkPayload> = {
  1: {
    kind: "text",
    body: `September retainer — Attestcoin settlement desk

Hours: 8, weekday coverage, CC3 testnet + Ethereum Sepolia.
You get a named desk for listing, proof submit, and “why did this revert” reads.

How to use it
1. Send the listing id and the Sepolia hash (or say “watch the pay page”).
2. We fetch the Attestcoin proof, submit, and tell you paid / still open / revert name.
3. You keep the USDC. Paidline never holds it.

Out of scope: mainnet, custom tokens, rewriting your contract.

Reply on the listing thread with the invoice number when you want the window.`,
  },
  2: {
    kind: "text",
    body: `Wire isPaid into your Creditcoin contract

Paidline (CC3 testnet): 0x4fB6aB16B3CEf1853DF4247b245E4de139108339

interface IPaidline {
    function isPaid(uint256 invoiceId) external view returns (bool);
}

contract Gate {
    IPaidline public immutable paidline;
    constructor(IPaidline checker) { paidline = checker; }
    function claim(uint256 invoiceId) external {
        require(paidline.isPaid(invoiceId), "unpaid");
        // unlock your work here
    }
}

Unknown ids return false. True only after a matching USDC transfer is proved and the listing is stamped. Listen for InvoicePaid if you prefer events to polling.`,
  },
  3: {
    kind: "text",
    body: `x402 gate on one listing URL

GET https://paidline.vercel.app/api/gate/3

Unpaid → HTTP 402
{
  "x402": true,
  "invoiceId": 3,
  "status": "unpaid",
  "amount": "<exact USDC base units>",
  "pay": "https://paidline.vercel.app/pay/3",
  "isPaid": false
}

Paid → HTTP 200 and this payload under "work".
Retry the same URL after the buyer sends exact USDC on Ethereum Sepolia. Do not poll a different path. The contract, not this server, is the source of paid.`,
  },
  4: {
    kind: "text",
    body: `Proof review of a Sepolia USDC flow

Send: listing id, Sepolia tx hash, what you expected.

We check, in order:
1. Receipt status is 1 (inclusion is not success).
2. Transfer log: USDC Sepolia 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238.
3. To = listing destination, value = exact sourceAmount.
4. Attestcoin proof-by-tx for chain key 1.
5. Creditcoin submitPayment revert name, if any (AmountMismatch, Replay, NotUnpaid, …).

You get a short written pass/fail with the matching log index. No custody. No “we think it’s paid.”`,
  },
  5: {
    kind: "text",
    body: `Pair session: pay on Ethereum, confirm on CC3

45 minutes, one listing, one payment.

Agenda
- Seller: create or pick a live listing, lock tCTC.
- Buyer: send exact USDC on Sepolia to the listing address.
- Confirm: paste hash or let the pay page watch Transfer logs, then submit the Attestcoin proof.
- Done: isPaid true, lock to the payer, checkout shows Get the work.

Bring two wallets (or one that can switch Creditcoin CC3 and Sepolia). Testnet only.`,
  },
  6: {
    kind: "text",
    body: `Listing and receipt copy for a live board

Title: short, the work, not the protocol.
Price: exact USDC. Checkout will add a few micro-units so two listings at the same sticker price do not collide.
What the buyer gets: one line they can screenshot.
Receipt: “The contract marked this paid. No company in the middle confirmed it.”
Gate blurb: “402 until paid. 200 is the work.”

Do not write “bilateral attested settlement.” Do not put the work on-chain. Attach it at list time; it unlocks after isPaid.`,
  },
  7: {
    kind: "text",
    body: `Mainnet checker deploy notes

Do not use forge script on Creditcoin RPCs that lack prevrandao. Use:

forge create src/Paidline.sol:Paidline \\
  --rpc-url <creditcoin-rpc> \\
  --private-key $CREDITCOIN_PRIVATE_KEY \\
  --broadcast --legacy --chain <id>

Then verify on Blockscout (compiler 0.8.28, via-ir, optimizer 200, evm cancun).

Swap:
- USDC address (Ethereum mainnet, not Sepolia).
- Source chain key Attestcoin uses for that chain.
- Prover URL for that deployment.

Keep replay on queryId + proved body + claimed hash. Do not take custody of USDC. Fund listings after create. Test isPaid(unknown) == false before you hang a product on it.`,
  },
  8: {
    kind: "text",
    body: `InvoicePaid listener (webhook spec)

Event: InvoicePaid(uint256 indexed invoiceId, bytes32 indexed sourceTxHash, address indexed releasedTo, uint256 localAmount)
Contract: 0x4fB6aB16B3CEf1853DF4247b245E4de139108339 (CC3 testnet)
RPC: https://rpc.cc3-testnet.creditcoin.network

POST your URL
{
  "invoiceId": 8,
  "sourceTxHash": "0x…",
  "releasedTo": "0x…",
  "localAmount": "<wei tCTC>",
  "creditcoinTx": "0x…"
}

Idempotent on invoiceId. Ignore if isPaid is still false (reorg / bad indexer). Do not treat the relayer as the signal — the log is.`,
  },
  9: {
    kind: "text",
    body: `You paid. This is the work.

Paidline listing for BUIDL CTC 2026 Fall judges.

1. This brief was sealed when the listing was created. Unpaid checkout and GET /api/gate/9 returned 402 without this body.
2. You sent exact USDC on Ethereum Sepolia. Paidline never held it.
3. Attestcoin proved the transfer. submitPayment matched token, destination, and amount.
4. isPaid(9) is true. Locked tCTC released to the paying wallet.
5. The same URL now returns 200 with this payload.

That is the product: remote proof, local unlock. No company in the middle confirmed it.

Live contract: 0x4fB6aB16B3CEf1853DF4247b245E4de139108339
Docs: https://paidline.vercel.app/docs
Gate: https://paidline.vercel.app/api/gate/9`,
  },
};

function seedWork(invoiceId: number): WorkPayload | null {
  return SEED_WORK[invoiceId] ?? null;
}

export async function hasWork(invoiceId: number): Promise<boolean> {
  if (seedWork(invoiceId)) return true;
  try {
    const sql = await getSql();
    const rows = await sql<{ invoice_id: number }>`
      select invoice_id from deliveries where invoice_id = ${invoiceId} limit 1
    `;
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function hasWorkIds(): Promise<Set<number>> {
  const ids = new Set(Object.keys(SEED_WORK).map(Number));
  try {
    const sql = await getSql();
    const rows = await sql<{ invoice_id: number }>`select invoice_id from deliveries`;
    for (const row of rows) ids.add(Number(row.invoice_id));
  } catch {
    /* PGLite/Neon not ready — seed still covers the live board */
  }
  return ids;
}

async function readStoredWork(invoiceId: number): Promise<WorkPayload | null> {
  try {
    const sql = await getSql();
    const rows = await sql<{ kind: string; body: string }>`
      select kind, body from deliveries where invoice_id = ${invoiceId} limit 1
    `;
    const row = rows[0];
    if (row && (row.kind === "link" || row.kind === "text") && row.body) {
      return { kind: row.kind, body: row.body };
    }
  } catch {
    /* fall through to seed */
  }
  return seedWork(invoiceId);
}

export async function getWorkIfPaid(invoiceId: number, paid: boolean): Promise<WorkPayload | null> {
  if (!paid) return null;
  return readStoredWork(invoiceId);
}

export async function saveWork(invoiceId: number, merchant: string, body: string): Promise<WorkPayload> {
  const payload = normalizeWork(body);
  const invoice = await readInvoice(invoiceId);
  if (!invoice) throw new Error("Listing not found.");
  if (invoice.merchant.toLowerCase() !== merchant.toLowerCase()) {
    throw new Error("Only the merchant can attach work.");
  }
  const sql = await getSql();
  await sql`
    insert into deliveries (invoice_id, merchant, kind, body)
    values (${invoiceId}, ${invoice.merchant.toLowerCase()}, ${payload.kind}, ${payload.body})
    on conflict (invoice_id) do nothing
  `;
  const saved = await readStoredWork(invoiceId);
  if (!saved) throw new Error("Could not save the work.");
  return saved;
}

export const sealWork = createServerFn({ method: "POST" })
  .validator((d: { invoiceId: number; merchant: string; body: string }) => {
    const invoiceId = Number(d?.invoiceId);
    const merchant = String(d?.merchant ?? "");
    const body = String(d?.body ?? "");
    if (!Number.isInteger(invoiceId) || invoiceId < 1) throw new Error("Bad invoice id.");
    if (!isAddress(merchant)) throw new Error("Connect the merchant wallet.");
    return { invoiceId, merchant, body };
  })
  .handler(async ({ data }) => saveWork(data.invoiceId, data.merchant, data.body));
