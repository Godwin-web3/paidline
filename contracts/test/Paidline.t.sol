// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {EvmV1Decoder} from "@gluwa/asc-contracts/contracts/common/EvmV1Decoder.sol";
import {Paidline} from "../src/Paidline.sol";
import {PaidlineHarness} from "./PaidlineHarness.sol";

contract PaidlineTest is Test {
    bytes32 constant TRANSFER = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef;
    address constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    uint256 constant CHAIN_KEY = 1;
    uint256 constant AMOUNT = 25_000_000;

    PaidlineHarness internal paidline;
    address internal merchant = address(0xA11CE);
    address internal buyer = address(0xB0B);
    address internal other = address(0xBEEF);

    function setUp() public {
        paidline = new PaidlineHarness();
        vm.deal(merchant, 10 ether);
    }

    function test_unknownInvoiceIsNotPaid() public view {
        assertFalse(paidline.isPaid(1));
        assertFalse(paidline.isPaid(999));
    }

    function test_createFundAndCancelRefunds() public {
        uint256 id = _create(1 ether);
        assertEq(address(paidline).balance, 1 ether);
        assertFalse(paidline.isPaid(id));

        uint256 before = merchant.balance;
        vm.prank(merchant);
        paidline.cancel(id);
        assertEq(merchant.balance, before + 1 ether);
        assertFalse(paidline.isPaid(id));
    }

    function test_duplicateOpenTermsRevert() public {
        _create(1 ether);
        vm.prank(merchant);
        vm.expectRevert(Paidline.DuplicateTerms.selector);
        paidline.createInvoice{value: 1 ether}(
            CHAIN_KEY, USDC, merchant, AMOUNT, uint64(block.timestamp + 1 days), "Retainer", "Work"
        );
    }

    function test_matchingTransferPaysAndReleasesToPayer() public {
        uint256 id = _create(1 ether);
        bytes memory encoded = _receipt(1, USDC, buyer, merchant, AMOUNT);
        bytes32 sourceTx = keccak256("sepolia-tx");
        bytes32 queryId = keccak256("query-1");

        uint256 buyerBefore = buyer.balance;
        paidline.forceSubmit(id, sourceTx, queryId, encoded);

        assertTrue(paidline.isPaid(id));
        assertEq(buyer.balance, buyerBefore + 1 ether);
        (,,,,,,,,,, bytes32 paidTx,,) = paidline.invoices(id);
        assertEq(paidTx, sourceTx);
    }

    function test_revertedReceiptIsNotAPayment() public {
        uint256 id = _create(1 ether);
        bytes memory encoded = _receipt(0, USDC, buyer, merchant, AMOUNT);
        vm.expectRevert(Paidline.SourceReverted.selector);
        paidline.forceSubmit(id, keccak256("tx"), keccak256("q"), encoded);
        assertFalse(paidline.isPaid(id));
    }

    function test_replayOfProvenQueryReverts() public {
        uint256 id = _create(1 ether);
        bytes memory encoded = _receipt(1, USDC, buyer, merchant, AMOUNT);
        bytes32 queryId = keccak256("same-leaf");
        paidline.forceSubmit(id, keccak256("tx-a"), queryId, encoded);
        assertTrue(paidline.isPaid(id));

        uint256 id2 = _createOtherAmount(2 ether, AMOUNT + 1);
        vm.expectRevert(Paidline.Replay.selector);
        paidline.forceSubmit(id2, keccak256("tx-b"), queryId, _receipt(1, USDC, buyer, merchant, AMOUNT + 1));
    }

    function test_replayOfProvedBodyRevertsEvenWithNewQueryId() public {
        uint256 id = _create(1 ether);
        bytes memory encoded = _receipt(1, USDC, buyer, merchant, AMOUNT);
        paidline.forceSubmit(id, keccak256("tx-a"), keccak256("q-a"), encoded);

        uint256 id2 = _create(1 ether);
        vm.expectRevert(Paidline.Replay.selector);
        paidline.forceSubmit(id2, keccak256("tx-b"), keccak256("q-b"), encoded);
    }

    function test_laterMatchingLogPaysWhenEarlierSameTokenLogIsWrongRecipient() public {
        uint256 id = _create(1 ether);
        bytes memory encoded = _receiptTwoTransfers({
            status: 1,
            token: USDC,
            fromAddr: buyer,
            firstTo: other,
            firstAmt: AMOUNT,
            secondTo: merchant,
            secondAmt: AMOUNT
        });
        paidline.forceSubmit(id, keccak256("tx"), keccak256("q"), encoded);
        assertTrue(paidline.isPaid(id));
    }

    function test_unfundedInvoiceCannotSettle() public {
        vm.prank(merchant);
        uint256 id = paidline.createInvoice(
            CHAIN_KEY, USDC, merchant, AMOUNT, uint64(block.timestamp + 1 days), "Retainer", "Work"
        );
        bytes memory encoded = _receipt(1, USDC, buyer, merchant, AMOUNT);
        vm.expectRevert(Paidline.Unfunded.selector);
        paidline.forceSubmit(id, keccak256("tx"), keccak256("q"), encoded);
    }

    function test_strangerCannotCancel() public {
        uint256 id = _create(1 ether);
        vm.prank(buyer);
        vm.expectRevert(Paidline.NotMerchant.selector);
        paidline.cancel(id);
    }

    function _create(uint256 lock) internal returns (uint256 id) {
        vm.prank(merchant);
        id = paidline.createInvoice{value: lock}(
            CHAIN_KEY, USDC, merchant, AMOUNT, uint64(block.timestamp + 1 days), "Retainer", "Work"
        );
    }

    function _createOtherAmount(uint256 lock, uint256 amount) internal returns (uint256 id) {
        vm.prank(merchant);
        id = paidline.createInvoice{value: lock}(
            CHAIN_KEY, USDC, merchant, amount, uint64(block.timestamp + 1 days), "Seat", "Work"
        );
    }

    function _receipt(uint8 status, address token, address fromAddr, address to, uint256 amount)
        internal
        pure
        returns (bytes memory)
    {
        EvmV1Decoder.LogEntryTuple[] memory logs = new EvmV1Decoder.LogEntryTuple[](1);
        logs[0] = _transfer(token, fromAddr, to, amount);
        return _encode(status, logs);
    }

    function _receiptTwoTransfers(
        uint8 status,
        address token,
        address fromAddr,
        address firstTo,
        uint256 firstAmt,
        address secondTo,
        uint256 secondAmt
    ) internal pure returns (bytes memory) {
        EvmV1Decoder.LogEntryTuple[] memory logs = new EvmV1Decoder.LogEntryTuple[](2);
        logs[0] = _transfer(token, fromAddr, firstTo, firstAmt);
        logs[1] = _transfer(token, fromAddr, secondTo, secondAmt);
        return _encode(status, logs);
    }

    function _transfer(address token, address fromAddr, address to, uint256 amount)
        internal
        pure
        returns (EvmV1Decoder.LogEntryTuple memory log)
    {
        bytes32[] memory topics = new bytes32[](3);
        topics[0] = TRANSFER;
        topics[1] = bytes32(uint256(uint160(fromAddr)));
        topics[2] = bytes32(uint256(uint160(to)));
        log = EvmV1Decoder.LogEntryTuple({address_: token, topics: topics, data: abi.encode(amount)});
    }

    function _encode(uint8 status, EvmV1Decoder.LogEntryTuple[] memory logs) internal pure returns (bytes memory) {
        bytes memory chunk0 =
            abi.encode(uint64(0), uint64(21_000), address(0), false, USDC, uint256(0), bytes(""));
        bytes memory chunk1 = abi.encode(
            uint64(11_155_111),
            uint128(1),
            uint128(1),
            new EvmV1Decoder.AccessListEntryBytes32[](0),
            uint8(0),
            bytes32(0),
            bytes32(0)
        );
        bytes memory chunk2 = abi.encode(status, uint64(21_000), logs, bytes(""));
        bytes[] memory chunks = new bytes[](3);
        chunks[0] = chunk0;
        chunks[1] = chunk1;
        chunks[2] = chunk2;
        return abi.encode(uint8(2), chunks);
    }
}
