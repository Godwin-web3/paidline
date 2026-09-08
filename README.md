# Paidline

A payment on one chain is not a fact on another until a contract says so.

Paidline is a payment verification layer on Creditcoin. A business issues an invoice: this amount, this token, this destination. The buyer pays USDC on Ethereum. Anyone submits the transaction. The contract verifies it, matches the invoice, marks it paid, and releases a separate Creditcoin balance to the payer. One transaction. No backend allowed to say it landed.

Remote proof. Local action. Two assets. Not a bridge.

## Live

Creditcoin CC3 testnet. Contract: [`0xA682c66F28a897191018F528bd8a69F0c47E992E`](https://creditcoin-testnet.blockscout.com/address/0xA682c66F28a897191018F528bd8a69F0c47E992E)

Sellers connect a Creditcoin wallet and issue invoices on-chain. Buyers send USDC on Ethereum Sepolia, then confirm from a wallet or by pasting the hash. Paidline fetches an Attestcoin proof and calls `submitPayment`. The contract is the only thing that may mark an invoice paid.

Each invoice is owned by the wallet that created it. Escrow, cancel, and the merchant list are isolated per merchant. Two open invoices cannot share the same chain, token, destination, and amount, so a transfer can only mean one invoice. The first matching payment settles it.

## How settlement works

- Inherits `ASCBase` from `@gluwa/asc-contracts`.
- `execute` verifies merkle inclusion and continuity against precompile `0x0FD2`.
- Then the contract:
  1. Requires receipt status `1`. Inclusion is not success.
  2. Reads `Transfer(address,address,uint256)` logs.
  3. Checks token, recipient, exact amount, chain, expiry, unpaid status.
  4. Rejects replayed source transactions.
  5. Marks PAID and releases native Creditcoin value in the same call.

The relayer in `scripts/relayer/submitPayment.mjs` fetches a proof and submits. It has no opinion.

Source chain: Ethereum Sepolia, chain key `1` on Creditcoin CC3 testnet. USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`.
