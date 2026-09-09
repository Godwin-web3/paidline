# Paidline

List work. Anyone can buy it. The contract is what says it’s paid.

Paidline is a public marketplace with a payment checker. You publish a listing on Creditcoin. A buyer sends USDC on Ethereum. Anyone submits the transfer. The contract matches token, destination, and exact amount, marks the listing paid, and releases locked Creditcoin to the paying wallet.

There is no buyer list. First matching payment claims it. Paidline never holds the USDC.

Live app: [paidline.vercel.app](https://paidline.vercel.app) · Marketplace: [paidline.vercel.app/pay](https://paidline.vercel.app/pay)

## Product

- **Marketplace** — every funded unpaid listing, public, no wallet to watch
- **Listings** — what you published, tied to your Creditcoin wallet
- **New listing** — title, USDC price, credit to lock, due date
- **Checkout** — send exact USDC on Ethereum Sepolia, or paste the hash
- **Receipt** — both explorer links once the contract confirms
- **API** — `GET /api/gate/:id` returns **402** until paid, **200** after

## Live contract

Creditcoin CC3 testnet.

[`0x6e88109Cf1f9679FAB8Faf2eD9C8bbCD8566a2c7`](https://creditcoin-testnet.blockscout.com/address/0x6e88109Cf1f9679FAB8Faf2eD9C8bbCD8566a2c7)

- Listings live on Creditcoin. Payments are USDC on Ethereum Sepolia.
- Two open listings cannot share the same chain, token, destination, and amount.
- Locked Creditcoin releases to the wallet that sent the matching transfer.
- USDC lands at the seller. Paidline never holds it.

USDC Sepolia: [`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`](https://sepolia.etherscan.io/token/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)

## For other contracts

Paidline is the checker. Other contracts do not talk to Attestcoin.

```solidity
interface IPaidline {
    function isPaid(uint256 invoiceId) external view returns (bool);
}
```

- `isPaid(invoiceId)` — true only after a matching remote payment has been verified and local value released. Unknown ids return false.
- `InvoicePaid(invoiceId, sourceTxHash, releasedTo, localAmount)` — emitted in the same transaction as the release.

Call the view, or listen for the event.

## HTTP gate

```
GET /api/gate/:id
```

Unpaid → `402 Payment Required` with amount and checkout URL. Paid → `200` and the resource. Agents retry the same request after paying.

## How settlement works

Inherits `ASCBase` from `@gluwa/asc-contracts`. `execute` verifies merkle inclusion and continuity against precompile `0x0FD2`. Then the contract:

1. Requires receipt status `1`. Inclusion is not success.
2. Reads `Transfer(address,address,uint256)` logs.
3. Checks token, recipient, exact amount, chain, expiry, unpaid status.
4. Rejects replayed source transactions.
5. Marks paid and releases native Creditcoin in the same call.

The relayer in `scripts/relayer/submitPayment.mjs` fetches a proof and submits. It has no opinion.

Source chain: Ethereum Sepolia, chain key `1` on Creditcoin CC3 testnet.
