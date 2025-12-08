// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract HelperConfig is Script {
    struct NetworkConfig {
        address paymentToken;
    }

    NetworkConfig public activeNetworkConfig;

    constructor() {
        if (block.chainid == 11155111) {
            activeNetworkConfig = getSepoliaEthConfig();
        } else {
            activeNetworkConfig = getOrCreateAnvilEthConfig();
        }
    }

    function getSepoliaEthConfig() public pure returns (NetworkConfig memory) {
        // Example: Sepolia USDC Address (Circle Faucet or similar)
        // You should update this to the token you want to use on Testnet!
        address sepoliaUsdc = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

        return NetworkConfig({paymentToken: sepoliaUsdc});
    }

    function getOrCreateAnvilEthConfig() public returns (NetworkConfig memory) {
        // 1. Deploy Mock Token
        vm.startBroadcast();
        MockERC20 mockToken = new MockERC20("Mock USDT", "mUSDT");
        vm.stopBroadcast();

        return NetworkConfig({paymentToken: address(mockToken)});
    }
}
