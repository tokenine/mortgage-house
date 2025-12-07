// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MortgageContract.sol"; // Contains MortgageBond contract
import "../src/MockERC20.sol";

contract DeployMortgageContract is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));

        // If no private key, use a default anvil key (account 0)
        // 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock Stablecoin (e.g. mUSDT)
        MockERC20 token = new MockERC20("Mock USDT", "mUSDT");
        console.log("Mock USDT deployed at:", address(token));

        // 2. Deploy Mortgage Bond
        // parameters: paymentToken, fundingCap
        uint256 fundingCap = 100_000 * 10 ** 6; // 100k tokens
        MortgageBond bond = new MortgageBond(address(token), fundingCap);
        console.log("MortgageBond deployed at:", address(bond));

        // 3. Setup for Frontend Dev: Mint tokens to the deployer and maybe a test user
        // The MockERC20 constructor already minted 1M to msg.sender (deployer)

        // Optional: Mint to a second known anvil account for testing (Anvil Account #1)
        address testUser = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        token.mint(testUser, 50_000 * 10 ** 6);
        console.log("Minted 50k mUSDT to test user:", testUser);

        vm.stopBroadcast();
    }
}
