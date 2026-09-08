// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ASCBase} from "@gluwa/asc-contracts/contracts/readability/ASCBase.sol";
import {EvmV1Decoder} from "@gluwa/asc-contracts/contracts/common/EvmV1Decoder.sol";
import {INativeQueryVerifier} from "@gluwa/asc-contracts/contracts/write-ability/common/INativeQueryVerifier.sol";

/// @title Paidline
/// @notice Universal payment verification on Creditcoin.
/// @dev Remote proof, local action. A Sepolia ERC-20 transfer never moves here.
///      This contract verifies that transfer via Attestcoin, then releases a
///      separate, pre-funded local balance. Inherit ASCBase so execute()
///      verifies merkle + continuity proofs at precompile 0x0FD2 before
///      _processAndEmitEvent runs. Anyone may submit. The contract decides.
///
///      Multi-merchant: each invoice is owned by msg.sender. Escrow, cancel,
///      and fund are merchant-gated. Open invoices cannot share the same
///      (chain, token, recipient, amount) so a Transfer can mean only one
///      unpaid invoice. Pending invoice id lives in transient storage so
///      submitters cannot clobber each other across transactions.
contract Paidline is ASCBase {
    enum Actions {
        SubmitPayment
    }

    enum Status {
        Unpaid,
        Paid,
        Cancelled
    }

    error InvalidAction(uint8 action);
    error UnknownInvoice();
    error NotUnpaid();
    error NotMerchant();
    error Expired();
    error Unfunded();
    error BadChain();
    error SourceReverted();
    error NoTransfer();
    error TokenMismatch();
    error RecipientMismatch();
    error AmountMismatch();
    error Replay();
    error AlreadyFunded();
    error ZeroValue();
    error DuplicateTerms();

    bytes32 public constant TRANSFER_EVENT_SIGNATURE =
        0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef;

    struct Invoice {
        address merchant;
        uint256 chainKey;
        address sourceToken;
        address sourceRecipient;
        uint256 sourceAmount;
        uint64 expiry;
        uint256 localAmount;
        address localReleaseTo;
        Status status;
        bool funded;
        bytes32 paidTxHash;
        string title;
        string releaseLabel;
    }

    uint256 public nextInvoiceId;
    mapping(uint256 => Invoice) public invoices;
    mapping(bytes32 => bool) public usedTxHashes;
    /// @notice Open invoice id for keccak(chainKey, token, recipient, amount). 0 = free.
    mapping(bytes32 => uint256) public openTerms;
    mapping(address => uint256[]) private _issued;

    uint256 transient pendingInvoiceId;
    bytes32 transient pendingSourceTx;

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed merchant,
        uint256 chainKey,
        address sourceToken,
        address sourceRecipient,
        uint256 sourceAmount,
        uint64 expiry,
        string title,
        string releaseLabel
    );
    event EscrowFunded(uint256 indexed invoiceId, uint256 localAmount);
    event InvoiceCancelled(uint256 indexed invoiceId);
    event InvoicePaid(
        uint256 indexed invoiceId,
        bytes32 indexed sourceTxHash,
        address indexed releasedTo,
        uint256 localAmount
    );

    constructor() {
        nextInvoiceId = 1;
    }

    function invoicesOf(address merchant) external view returns (uint256[] memory) {
        return _issued[merchant];
    }

    /// @notice Register what a remote payment must look like. Locks funds if value is sent.
    function createInvoice(
        uint256 chainKey,
        address sourceToken,
        address sourceRecipient,
        uint256 sourceAmount,
        uint64 expiry,
        string calldata title,
        string calldata releaseLabel
    ) external payable returns (uint256 invoiceId) {
        if (sourceToken == address(0) || sourceRecipient == address(0)) revert ZeroValue();
        if (sourceAmount == 0 || expiry <= block.timestamp) revert ZeroValue();
        if (bytes(title).length == 0) revert ZeroValue();

        bytes32 key = _termsKey(chainKey, sourceToken, sourceRecipient, sourceAmount);
        if (openTerms[key] != 0) revert DuplicateTerms();

        invoiceId = nextInvoiceId++;
        Invoice storage inv = invoices[invoiceId];
        inv.merchant = msg.sender;
        inv.chainKey = chainKey;
        inv.sourceToken = sourceToken;
        inv.sourceRecipient = sourceRecipient;
        inv.sourceAmount = sourceAmount;
        inv.expiry = expiry;
        inv.status = Status.Unpaid;
        inv.title = title;
        inv.releaseLabel = releaseLabel;

        openTerms[key] = invoiceId;
        _issued[msg.sender].push(invoiceId);

        emit InvoiceCreated(
            invoiceId,
            msg.sender,
            chainKey,
            sourceToken,
            sourceRecipient,
            sourceAmount,
            expiry,
            title,
            releaseLabel
        );

        if (msg.value > 0) {
            _fund(invoiceId);
        }
    }

    /// @notice Lock native Creditcoin value that will release if the invoice pays.
    function fund(uint256 invoiceId) external payable {
        _fund(invoiceId);
    }

    function cancel(uint256 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        if (inv.merchant == address(0)) revert UnknownInvoice();
        if (msg.sender != inv.merchant) revert NotMerchant();
        if (inv.status != Status.Unpaid) revert NotUnpaid();
        inv.status = Status.Cancelled;
        delete openTerms[_termsKey(inv.chainKey, inv.sourceToken, inv.sourceRecipient, inv.sourceAmount)];
        uint256 refund = 0;
        if (inv.funded) {
            inv.funded = false;
            refund = inv.localAmount;
            inv.localAmount = 0;
        }
        emit InvoiceCancelled(invoiceId);
        if (refund > 0) {
            (bool ok,) = inv.merchant.call{value: refund}("");
            require(ok, "refund failed");
        }
    }

    /// @dev Called by ASCBase.execute after the precompile accepts the proof.
    function _processAndEmitEvent(uint8 action, bytes32 queryId, bytes memory encodedTransaction)
        internal
        override
    {
        if (action != uint8(Actions.SubmitPayment)) revert InvalidAction(action);
        _submitPayment(queryId, encodedTransaction);
    }

    /// @notice One call: bind invoice, verify proof, match Transfer, release local escrow to the payer.
    function submitPayment(
        uint256 invoiceId,
        bytes32 sourceTxHash,
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings,
        bytes32 lowerEndpointDigest,
        bytes32[] calldata continuityRoots
    ) external returns (bool) {
        Invoice storage inv = invoices[invoiceId];
        if (inv.merchant == address(0)) revert UnknownInvoice();
        if (inv.chainKey != chainKey) revert BadChain();
        pendingInvoiceId = invoiceId;
        pendingSourceTx = sourceTxHash;
        return this.execute(
            uint8(Actions.SubmitPayment),
            chainKey,
            blockHeight,
            encodedTransaction,
            merkleRoot,
            siblings,
            lowerEndpointDigest,
            continuityRoots
        );
    }

    function _submitPayment(bytes32 queryId, bytes memory encodedTransaction) internal {
        uint256 invoiceId = pendingInvoiceId;
        Invoice storage inv = invoices[invoiceId];
        if (inv.merchant == address(0)) revert UnknownInvoice();
        if (inv.status != Status.Unpaid) revert NotUnpaid();
        if (block.timestamp > inv.expiry) revert Expired();
        if (!inv.funded) revert Unfunded();

        uint8 txType = EvmV1Decoder.getTransactionType(encodedTransaction);
        require(EvmV1Decoder.isValidTransactionType(txType), "unsupported tx type");

        EvmV1Decoder.ReceiptFields memory rec = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        if (rec.receiptStatus != 1) revert SourceReverted();

        EvmV1Decoder.LogEntry[] memory logs =
            EvmV1Decoder.getLogsByEventSignature(rec, TRANSFER_EVENT_SIGNATURE);
        if (logs.length == 0) revert NoTransfer();

        (address token, address from, address to, uint256 amount) = _firstMatchingTransfer(logs, inv);

        bytes32 sourceTx = pendingSourceTx;
        if (sourceTx == bytes32(0)) revert ZeroValue();
        if (usedTxHashes[sourceTx]) revert Replay();
        usedTxHashes[sourceTx] = true;

        delete openTerms[_termsKey(inv.chainKey, inv.sourceToken, inv.sourceRecipient, inv.sourceAmount)];

        inv.status = Status.Paid;
        inv.paidTxHash = sourceTx;
        inv.funded = false;
        uint256 releaseAmount = inv.localAmount;
        inv.localAmount = 0;
        inv.localReleaseTo = from;

        emit InvoicePaid(invoiceId, sourceTx, from, releaseAmount);

        (bool ok,) = from.call{value: releaseAmount}("");
        require(ok, "release failed");

        queryId;
        token;
        to;
        amount;
    }

    function _firstMatchingTransfer(EvmV1Decoder.LogEntry[] memory logs, Invoice storage inv)
        internal
        view
        returns (address token, address from, address to, uint256 amount)
    {
        for (uint256 i = 0; i < logs.length; i++) {
            EvmV1Decoder.LogEntry memory log = logs[i];
            if (log.topics.length < 3) continue;
            if (log.topics[0] != TRANSFER_EVENT_SIGNATURE) continue;
            token = log.address_;
            from = address(uint160(uint256(log.topics[1])));
            to = address(uint160(uint256(log.topics[2])));
            if (log.data.length != 32) continue;
            amount = abi.decode(log.data, (uint256));
            if (token != inv.sourceToken) continue;
            if (to != inv.sourceRecipient) revert RecipientMismatch();
            if (amount != inv.sourceAmount) revert AmountMismatch();
            return (token, from, to, amount);
        }
        if (logs.length > 0 && logs[0].address_ != inv.sourceToken) revert TokenMismatch();
        revert NoTransfer();
    }

    function _termsKey(uint256 chainKey, address token, address recipient, uint256 amount)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(chainKey, token, recipient, amount));
    }

    function _fund(uint256 invoiceId) internal {
        Invoice storage inv = invoices[invoiceId];
        if (inv.merchant == address(0)) revert UnknownInvoice();
        if (inv.status != Status.Unpaid) revert NotUnpaid();
        if (inv.funded) revert AlreadyFunded();
        if (msg.value == 0) revert ZeroValue();
        if (msg.sender != inv.merchant) revert NotMerchant();
        inv.localAmount = msg.value;
        inv.funded = true;
        emit EscrowFunded(invoiceId, msg.value);
    }
}
