// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MortgageContract.sol";
// import {ERC20} from "openzeppelin-contracts/token/ERC20/ERC20.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 Token for testing
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MCK") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MortgageContractTest is Test {
    MortgageBond public mortgage;
    MockERC20 public paymentToken;

    address public issuer = address(0x1);
    address public investor1 = address(0x2);
    address public investor2 = address(0x3);

    uint256 public constant FUNDING_CAP = 100_000 * 10 ** 18;

    function setUp() public {
        // Setup payment token
        vm.startPrank(issuer);
        paymentToken = new MockERC20();

        // Deploy Mortgage Bond
        mortgage = new MortgageBond(address(paymentToken), FUNDING_CAP);
        vm.stopPrank();

        // Fund investors
        paymentToken.mint(investor1, 50_000 * 10 ** 18);
        paymentToken.mint(investor2, 50_000 * 10 ** 18);
    }

    function test_Deployment() public {
        assertEq(mortgage.issuer(), issuer);
        assertEq(address(mortgage.paymentToken()), address(paymentToken));
        assertEq(mortgage.FUNDING_CAP(), FUNDING_CAP);
        assertTrue(mortgage.isFundingActive());
    }

    function test_Invest() public {
        uint256 investAmount = 10_000 * 10 ** 18;

        vm.startPrank(investor1);
        paymentToken.approve(address(mortgage), investAmount);
        mortgage.invest(investAmount);
        vm.stopPrank();

        (uint256 shares, , ) = mortgage.investors(investor1);
        assertEq(shares, investAmount);
        assertEq(mortgage.totalPrincipalRaised(), investAmount);
    }

    function test_Invest_RevertIfFundingClosed() public {
        vm.startPrank(issuer);
        mortgage.withdrawPrincipal(); // This closes funding
        vm.stopPrank();

        uint256 investAmount = 1000;

        vm.startPrank(investor1);
        paymentToken.approve(address(mortgage), investAmount);
        vm.expectRevert("Funding closed");
        mortgage.invest(investAmount);
        vm.stopPrank();
    }

    function test_Invest_RevertIfCapReached() public {
        uint256 investAmount = FUNDING_CAP + 1;
        paymentToken.mint(investor1, investAmount); // Ensure enough balance

        vm.startPrank(investor1);
        paymentToken.approve(address(mortgage), investAmount);
        vm.expectRevert("Funding Cap reached");
        mortgage.invest(investAmount);
        vm.stopPrank();
    }

    function test_Rewards_DistributionAndClaim() public {
        uint256 investAmount = 10_000 * 10 ** 18;

        // Investor1 invests
        vm.startPrank(investor1);
        paymentToken.approve(address(mortgage), investAmount);
        mortgage.invest(investAmount);
        vm.stopPrank();

        uint256 interestAmount = 500 * 10 ** 18;
        paymentToken.mint(issuer, interestAmount);

        // Issuer distributes interest
        vm.startPrank(issuer);
        paymentToken.approve(address(mortgage), interestAmount);
        mortgage.distributeInterest(interestAmount);
        vm.stopPrank();

        // Check pending rewards
        (uint256 pendingInt, ) = mortgage.getPendingRewards(investor1);
        // Should be full amount since only 1 investor
        uint256 expectedAmount = (interestAmount * investAmount) / FUNDING_CAP;
        assertApproxEqAbs(pendingInt, expectedAmount, 100);

        // Claim rewards
        uint256 balanceBefore = paymentToken.balanceOf(investor1);
        vm.startPrank(investor1);
        mortgage.claimRewards();
        vm.stopPrank();
        uint256 balanceAfter = paymentToken.balanceOf(investor1);

        assertApproxEqAbs(balanceAfter - balanceBefore, expectedAmount, 100);
    }

    function test_Marketplace_FullCycle() public {
        uint256 investAmount = 10_000 * 10 ** 18;

        // 1. Investor1 invests
        vm.startPrank(investor1);
        paymentToken.approve(address(mortgage), investAmount);
        mortgage.invest(investAmount);
        vm.stopPrank();

        // 2. Investor1 creates sell order
        uint256 sellShares = 5_000 * 10 ** 18;
        uint256 price = 6_000 * 10 ** 18; // Premium

        vm.startPrank(investor1);
        mortgage.createSellOrder(sellShares, price);
        vm.stopPrank();

        (
            address seller,
            uint256 sAmount,
            uint256 sPrice,
            bool active
        ) = mortgage.sellOrders(1);
        assertEq(seller, investor1);
        assertEq(sAmount, sellShares);
        assertEq(sPrice, price);
        assertTrue(active);

        // 3. Investor2 buys order
        vm.startPrank(investor2);
        paymentToken.approve(address(mortgage), price);
        mortgage.buyShare(1);
        vm.stopPrank();

        // Check balances/shares after trade
        (uint256 shares1, , ) = mortgage.investors(investor1);
        (uint256 shares2, , ) = mortgage.investors(investor2);

        assertEq(shares1, investAmount - sellShares);
        assertEq(shares2, sellShares);
    }
}
