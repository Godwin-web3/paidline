# Attestcoin Protocol integration

Required technical documentation for BUIDL CTC 2026 Fall. Paidline uses Attestcoin as the **core settlement path**, not as an add-on.

## What Attestcoin is doing here

Attestcoin lets a Creditcoin contract verify that a transaction on another chain is in that chain’s history, without a trusted oracle. Paidline’s product *is* that verification, applied to an ERC-20 `Transfer`.

| Piece | Role |
|---|---|
| Ethereum Sepolia | Buyer sends USDC. Paidline never receives it. |
| Proof builder `https://prover.cc3-testnet.creditcoin.network` | Builds Merkle inclusion + continuity for a tx hash. |
| Precompile `0x0FD2` | Native query verifier. `ASCBase.execute` calls `verifyAndEmit`. |
| `ASCBase` (`@gluwa/asc-contracts` 0.2.1) | Dedupes by `queryId`, then calls our handler. |
| `Paidline._submitPayment` | App logic: receipt status, Transfer match, release. |

Other contracts on Creditcoin do **not** integrate Attestcoin. They call `isPaid` or listen for `InvoicePaid`. Paidline is the checker.

## Call path

```
Buyer          Sepolia USDC.transfer(seller, exactAmount)
Anyone         GET /api/v1/proof-by-tx/1/{txHash}
Anyone         Paidline.submitPayment(invoiceId, txHash, chainKey, blockHeight, txBytes, merkle, continuity)
ASCBase.execute
  queryId = keccak256(chainKey || blockHeight || txIndex)
  require !processedQueries[queryId]
  VERIFIER.verifyAndEmit(...)   // precompile 0x0FD2
  processedQueries[queryId] = true
  Paidline._submitPayment(queryId, encodedTransaction)
    receiptStatus == 1
    scan Transfer logs (token, to, exact amount)
    usedTxHashes[queryId], [keccak256(txBytes)], [sourceTxHash]
    status = Paid; emit InvoicePaid; send locked CTC to Transfer.from
```

`queryId` is **not** the Ethereum tx hash. It is the Attestcoin leaf id: chain key, block height, and the tx index recovered from the Merkle path (`VERIFIER.calculateTxIndex`). The claimed `sourceTxHash` is stored on the invoice for explorers. It is **not** sufficient to settle. Replaying the same proven leaf or the same proved body reverts even if the caller invents a new hash.

## What the relayer is allowed to do

`scripts/relayer/submitPayment.mjs` and the app’s `confirmPayment` server function:

1. Fetch the proof for a hash.
2. Call `submitPayment`.

They cannot mark an invoice paid. They cannot skip `0x0FD2`. They cannot change token, recipient, or amount. A lying `sourceTxHash` cannot reuse a proven payment — `usedTxHashes[queryId]` and `usedTxHashes[keccak256(encodedTransaction)]` already consumed that leaf.

## Match rules (after the proof)

Applied only if the precompile accepted the proof:

1. Invoice exists, status unpaid, not expired, funded.
2. `chainKey` matches the invoice.
3. Receipt status is `1`. A reverted source tx is not a payment.
4. At least one `Transfer(address,address,uint256)` log.
5. Scan **all** Transfer logs. A same-token transfer to the wrong recipient does not abort a later matching log (aggregators, leftover hops).
6. Token, recipient, and **exact** amount must match. Overpay is not close enough.
7. Two open invoices cannot share `(chainKey, token, recipient, amount)`.

## Local action

Listings lock native Creditcoin at create/fund time. That lock is a receipt bond, not escrow of the USDC. On a successful match it is sent to `Transfer.from` (the paying wallet) in the same transaction as `InvoicePaid`. USDC already sat at `sourceRecipient` on Ethereum.

## Addresses (CC3 testnet)

| Item | Value |
|---|---|
| Paidline | [`0x4fB6aB16B3CEf1853DF4247b245E4de139108339`](https://creditcoin-testnet.blockscout.com/address/0x4fB6aB16B3CEf1853DF4247b245E4de139108339) (verified) |
| Deploy tx | [`0x1bfe3e327dc39245f89179ff5d056a7d8c92bf21e4476bd619d63970bab618ec`](https://creditcoin-testnet.blockscout.com/tx/0x1bfe3e327dc39245f89179ff5d056a7d8c92bf21e4476bd619d63970bab618ec) |
| Chain id | `102031` |
| Block prover | `0x0000000000000000000000000000000000000FD2` |
| Sepolia chain key | `1` |
| USDC Sepolia | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| Proof builder | `https://prover.cc3-testnet.creditcoin.network` |

This address is the query-id replay + Transfer-log scanning build, verified on Blockscout.

## Tests that pin this behavior

```
npm run test:forge
```

- Matching transfer pays and releases CTC to the payer
- Reverted receipt is not a payment
- Replay of the same `queryId` reverts
- Replay of the same proved body with a new query id reverts
- A later matching log still pays when an earlier same-token log is the wrong recipient
- Unfunded invoices cannot settle
