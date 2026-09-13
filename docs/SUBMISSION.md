# DoraHacks paste

Copy into the BUIDL CTC 2026 Fall form. Deadline: 14 Sep 2026 03:59 UTC.

**Project name:** Paidline

**Sector:** RWA (secondary: AI)

**GitHub:** https://github.com/Godwin-web3/paidline

**Demo video:** https://paidline.vercel.app/demo (file: https://paidline.vercel.app/demo.mp4)

**Deck PDF:** https://paidline.vercel.app/paidline-buidl-ctc-2026-fall.pdf

(also: https://github.com/Godwin-web3/paidline/raw/main/docs/paidline-buidl-ctc-2026-fall.pdf after you push)

**Live app:** https://paidline.vercel.app

**Contract (CC3 testnet, verified):** https://creditcoin-testnet.blockscout.com/address/0x4fB6aB16B3CEf1853DF4247b245E4de139108339

**Attestcoin Protocol integration summary:**

Paidline inherits ASCBase. A Sepolia USDC transfer is proved through Attestcoin precompile 0x0FD2 (Merkle inclusion + continuity). queryId is keccak256(chainKey, blockHeight, txIndex). After the proof, the contract requires receipt status 1, scans Transfer logs for exact token, recipient, and amount, then marks the listing paid and releases a Creditcoin receipt bond to the payer. Replay is keyed on query id and the proved body — the relayer cannot assert payment. Other contracts call isPaid; they never talk to Attestcoin. Agents get HTTP 402 until paid, 200 after. Full write-up: docs/ATTESTCOIN.md

**Project description:**

Paidline is a public marketplace with a payment checker. You list work on Creditcoin. Anyone pays the exact USDC on Ethereum. Attestcoin proves that transfer. The contract is the only thing that may say it is paid. First matching payment claims the listing. USDC never sits in Paidline. Other apps gate on isPaid. Agents retry GET /api/gate/:id after a 402.
