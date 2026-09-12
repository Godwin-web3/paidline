// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Paidline} from "../src/Paidline.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        Paidline paidline = new Paidline();
        vm.stopBroadcast();
        console.log("Paidline", address(paidline));
    }
}
