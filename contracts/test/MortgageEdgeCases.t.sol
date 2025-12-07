// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MortgageContract.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

// Re-use logic from main test
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MCK") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MortgageEdgeCasesTest is Test {
    MortgageBond public mortgage;
    MockERC20 public paymentToken;

    address public issuer = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);

    uint256 public constant FUNDING_CAP = 100_000 * 10 ** 18;

    function setUp() public {
        vm.startPrank(issuer);
        paymentToken = new MockERC20();
        mortgage = new MortgageBond(address(paymentToken), FUNDING_CAP);
        vm.stopPrank();

        paymentToken.mint(user1, 50_000 * 10 ** 18);
        paymentToken.mint(user2, 50_000 * 10 ** 18);
    }

    // EDGE CASE 1: Distributing Interest with ZERO investors
    function test_Edge_DistributeNoInvestors() public {
        uint256 interest = 1000 * 10 ** 18;
        paymentToken.mint(issuer, interest);

        vm.startPrank(issuer);
        paymentToken.approve(address(mortgage), interest);

        // This should NOT fail, but 'amountForInvestors' should be 0 because raised is 0
        mortgage.distributeInterest(interest);
        vm.stopPrank();

        // Check internal state
        assertEq(
            mortgage.accInterestPerShare(),
            (interest * 1e18) / FUNDING_CAP
        );
        // Contract balance should be 0 because amountForInvestors was 0
        assertEq(paymentToken.balanceOf(address(mortgage)), 0);
    }

    // EDGE CASE 2: Invest 0 Amount
    function test_Edge_InvestZero() public {
        vm.startPrank(user1);
        paymentToken.approve(address(mortgage), 0);
        // Typically should allow but do nothing, or revert if logic dictates
        // The ERC20 transfer might succeed with 0.
        mortgage.invest(0);
        vm.stopPrank();

        (uint256 shares, , ) = mortgage.investors(user1);
        assertEq(shares, 0);
    }

    // EDGE CASE 3: Claiming with Zero Rewards
    function test_Edge_ClaimZero() public {
        vm.startPrank(user1);
        // Invest something first so they have shares (condition: shares > 0)
        paymentToken.approve(address(mortgage), 1000);
        mortgage.invest(1000);

        // No rewards distributed yet
        vm.expectRevert("Nothing to claim");
        mortgage.claimRewards();
        vm.stopPrank();
    }

    // EDGE CASE 4: Sell more shares than owned
    function test_Edge_SellInsufficientShares() public {
        vm.startPrank(user1);
        paymentToken.approve(address(mortgage), 1000);
        mortgage.invest(1000);

        // Try to sell 1001
        vm.expectRevert("Not enough shares");
        mortgage.createSellOrder(1001, 1000);
        vm.stopPrank();
    }

    // EDGE CASE 5: Buying Cancelled Order
    function test_Edge_BuyCancelledOrder() public {
        // 1. Setup Order
        vm.startPrank(user1);
        paymentToken.approve(address(mortgage), 1000);
        mortgage.invest(1000);
        mortgage.createSellOrder(500, 500); // ID 1
        vm.stopPrank();

        // 2. Cancel it
        vm.startPrank(user1);
        mortgage.cancelSellOrder(1);
        vm.stopPrank();

        // 3. User 2 tries to buy
        vm.startPrank(user2);
        paymentToken.approve(address(mortgage), 500);
        vm.expectRevert("Order not active");
        mortgage.buyShare(1);
        vm.stopPrank();
    }

    // EDGE CASE 6: Buy Own Order (Self-Trade)
    // The contract logic allows this currently (transfers money to self, shares to self).
    // It's weird but not fatal in Solidity usually, but let's see if it works or breaks state.
    function test_Edge_BuyOwnOrder() public {
        vm.startPrank(user1);
        paymentToken.approve(address(mortgage), 2000);
        mortgage.invest(1000);
        mortgage.createSellOrder(500, 500); // ID 1

        // Approve contract to spend user1's tokens for the "buy" (market buy)
        // User1 is buying from User1.
        // 1. User1 pays 500 USDT -> User1 (TransferFrom might fail if self-transfer restricted, usually ok)
        // 2. Contract moves 500 shares -> User1

        // NOTE: In the contract code:
        // _safeTransferFrom(msg.sender, order.seller, order.price);
        // msg.sender = user1, order.seller = user1
        // MockERC20 (OpenZeppelin) allows self transfer.

        mortgage.buyShare(1);
        vm.stopPrank();

        (uint256 shares, , ) = mortgage.investors(user1);
        // Started 1000. Sold 500 (shares=500). Bought 500 (shares=1000).
        assertEq(shares, 1000);

        // Order should be inactive
        (, , , bool active) = mortgage.sellOrders(1);
        assertFalse(active);
    }
}
