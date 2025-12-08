pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MortgageContract.sol";
import "../src/MockERC20.sol";

contract DeployMortgageContract is Script {
    // Config Constants
    uint256 public constant ANVIL_CHAIN_ID = 31337;
    uint256 public constant NEW_TEST_CHAIN_ID = 7117;
    uint256 public constant SEPOLIA_CHAIN_ID = 11155111;

    function run() external {
        // 1. Setup Signer
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));

        if (deployerPrivateKey != 0) {
            // 1a. Use provided env var
            vm.startBroadcast(deployerPrivateKey);
        } else if (block.chainid == ANVIL_CHAIN_ID) {
            // 1b. Use default Anvil key for local dev convenience
            uint256 anvilKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
            vm.startBroadcast(anvilKey);
        } else {
            // 1c. Use CLI-provided signer (--account, --ledger, --interactive)
            vm.startBroadcast();
        }

        // 2. Get or Deploy Payment Token
        address paymentToken = getOrCreatePaymentToken();

        // 3. Deploy Mortgage Bond
        uint256 fundingCap = 100_000 * 10 ** 6; // 100k tokens
        MortgageBond bond = new MortgageBond(paymentToken, fundingCap);

        console.log("--------------------------------------------------");
        console.log("Deployment Summary:");
        console.log("Chain ID:", block.chainid);
        console.log("MortgageBond deployed at:", address(bond));
        console.log("Payment Token:", paymentToken);
        console.log("--------------------------------------------------");

        // 4. Post-Deploy Minting (Only for Test Environments)
        // If we deployed a fresh Mock token, mint some to the deployer and test user
        if (isTestChain(block.chainid)) {
            MockERC20(paymentToken).mint(msg.sender, 1_000_000 * 10 ** 6);

            address testUser = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
            MockERC20(paymentToken).mint(testUser, 50_000 * 10 ** 6);
            console.log("Minted tokens for testing to:", testUser);
        }

        vm.stopBroadcast();
    }

    function getOrCreatePaymentToken() internal returns (address) {
        if (block.chainid == SEPOLIA_CHAIN_ID) {
            // Sepolia USDC (Example)
            return 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
        }

        if (isTestChain(block.chainid)) {
            // For Anvil or your Custom Testnet (7117), deploy a fresh mock
            MockERC20 mock = new MockERC20("Mock USDT", "mUSDT");
            console.log("Deployed new Mock Token at:", address(mock));
            return address(mock);
        }

        revert("Chain ID not supported for automatic configuration");
    }

    function isTestChain(uint256 chainId) internal pure returns (bool) {
        return chainId == ANVIL_CHAIN_ID || chainId == NEW_TEST_CHAIN_ID;
    }
}
