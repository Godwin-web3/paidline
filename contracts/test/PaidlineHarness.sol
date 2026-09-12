// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Paidline} from "../src/Paidline.sol";

/// @dev Test-only: skip the 0x0FD2 precompile and drive `_submitPayment` directly.
contract PaidlineHarness is Paidline {
    function forceSubmit(uint256 invoiceId, bytes32 sourceTxHash, bytes32 queryId, bytes memory encodedTransaction)
        external
    {
        pendingInvoiceId = invoiceId;
        pendingSourceTx = sourceTxHash;
        _submitPayment(queryId, encodedTransaction);
    }
}
