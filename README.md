# Paidline

**BUIDL CTC 2026 Fall · RWA + AI**

A public marketplace with a payment checker. Listings live on Creditcoin. Buyers send USDC on Ethereum. Attestcoin proves the transfer. The contract is the only thing that may say it is paid.

Live app: [paidline.vercel.app](https://paidline.vercel.app) · Marketplace: [paidline.vercel.app/pay](https://paidline.vercel.app/pay) · Demo: [paidline.vercel.app/demo](https://paidline.vercel.app/demo)

Deck: [`docs/paidline-buidl-ctc-2026-fall.pdf`](docs/paidline-buidl-ctc-2026-fall.pdf) · Attestcoin write-up: [`docs/ATTESTCOIN.md`](docs/ATTESTCOIN.md)

## Why this exists

Creditcoin already proves that a foreign-chain transaction happened. Most apps still rebuild that proof path for one use case (a loan, a bridge, a score). Paidline is the checker other contracts call.

- Seller lists work. Anyone may buy it. First matching USDC claims it.
- USDC lands at the seller. Paidline never holds it.
- Other contracts call `isPaid(id)` or listen for `InvoicePaid`. They do not talk to Attestcoin.
- Agents hit `GET /api/gate/:id` — **402** until paid, **200** after. Same URL. x402.

This is not a credit score and not invoice financing. It is a settlement primitive: remote proof, local action.

## Attestcoin Protocol integration

Paidline inherits `ASCBase` from `@gluwa/asc-contracts`. Settlement is impossible without a verified proof.

1. Anyone calls `submitPayment` with a Sepolia tx hash and the proof from `prover.cc3-testnet.creditcoin.network`.
2. `execute()` verifies Merkle inclusion and continuity at precompile **`0x0FD2`**.
3. `ASCBase` computes `queryId = keccak256(chainKey, blockHeight, txIndex)` and rejects a processed leaf.
4. Paidline then requires receipt status `1` (inclusion is not success), scans `Transfer` logs, and matches **token, recipient, exact amount, chain, expiry, unpaid, funded**.
5. Replay is keyed on **query id**, **proved tx body**, and the claimed source hash — a caller cannot relabel a proven payment with a fake hash and settle twice.
6. The same transaction marks the invoice paid, emits `InvoicePaid`, and releases locked Creditcoin to the paying wallet.

The relayer in `scripts/relayer/submitPayment.mjs` fetches a proof and submits. It has no opinion.

Full sequence, addresses, and what we do *not* trust the relayer for: [`docs/ATTESTCOIN.md`](docs/ATTESTCOIN.md).

## Live contract

Creditcoin CC3 testnet (chain id `102031`).

[`0x4fB6aB16B3CEf1853DF4247b245E4de139108339`](https://creditcoin-testnet.blockscout.com/address/0x4fB6aB16B3CEf1853DF4247b245E4de139108339) — **verified** on Blockscout.

Deploy tx: [`0x1bfe3e327dc39245f89179ff5d056a7d8c92bf21e4476bd619d63970bab618ec`](https://creditcoin-testnet.blockscout.com/tx/0x1bfe3e327dc39245f89179ff5d056a7d8c92bf21e4476bd619d63970bab618ec)

USDC Sepolia: [`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`](https://sepolia.etherscan.io/token/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)

Source chain key on CC3 testnet: `1`. Deployer: `0xd9EA8ff9654cF57820977663767707ce0db0B6C4`.

`forge script` on this RPC fails (`prevrandao not set`). Deploy with:

```bash
cd contracts
forge create src/Paidline.sol:Paidline \
  --rpc-url https://rpc.cc3-testnet.creditcoin.network \
  --private-key $CREDITCOIN_PRIVATE_KEY \
  --broadcast --legacy --chain 102031
forge verify-contract <ADDR> src/Paidline.sol:Paidline \
  --verifier blockscout \
  --verifier-url https://creditcoin-testnet.blockscout.com/api/ \
  --chain 102031 \
  --compiler-version 0.8.28 \
  --via-ir \
  --optimizer-runs 200 \
  --evm-version cancun
```

## Product

- **Marketplace** — every funded unpaid listing, public, no wallet to watch
- **Listings** — what you published, tied to your Creditcoin wallet
- **New listing** — title, USDC price, credit to lock, due date
- **Checkout** — send exact USDC on Ethereum Sepolia, or paste the hash
- **Receipt** — both explorer links once the contract confirms
- **API** — `GET /api/gate/:id` returns **402** until paid, **200** after

Locked Creditcoin is a tiny receipt bond, not the goods. It releases to the wallet that sent the matching USDC so the buyer holds an on-chain stamp. The work itself is gated by `isPaid` or the HTTP gate.

Two open listings cannot share the same chain, token, destination, and amount. One payment can only mean one invoice.

## For other contracts

```solidity
interface IPaidline {
    function isPaid(uint256 invoiceId) external view returns (bool);
}
```

- `isPaid(invoiceId)` — true only after a matching remote payment has been verified and local value released. Unknown ids return false.
- `InvoicePaid(invoiceId, sourceTxHash, releasedTo, localAmount)` — emitted in the same transaction as the release.

## HTTP gate

```
GET /api/gate/:id
```

Unpaid → `402 Payment Required` with amount and checkout URL. Paid → `200` and the resource. Agents retry the same request after paying.

## Tests

```bash
npm test          # matcher + app scripts
npm run test:forge  # 10 Foundry tests: match, replay, revert, refund
```

Foundry covers: unknown `isPaid` is false, fund/cancel refunds, duplicate terms, matching transfer releases CTC to the payer, reverted receipts, query-id replay, proved-body replay, a later matching log after a same-token miss, unfunded settle, stranger cancel.

## Run locally

```bash
npm install
npm run dev
```

App binds `0.0.0.0:8080`. Optional: `CREDITCOIN_WALLET_PRIVATE_KEY` so checkout can submit the proof for the buyer.

## Track

**RWA** — real USDC payment, on-chain paid flag, no custodian. **AI** — x402 gate so an agent can buy a listing without a human dashboard.
