// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MortgageContract.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OperationalMetricsTest is Test {
    MortgageContract public mortgageContract;
    IERC20 public usdtToken;

    // Test addresses
    address public owner = address(0x1);
    address public operator = address(0x2);
    address public borrower = address(0x3);
    address public investor1 = address(0x4);
    address public investor2 = address(0x5);
    address public investor3 = address(0x6);

    // Test constants
    uint256 public constant LOAN_AMOUNT = 100_000 * 10**6; // 100,000 USDT
    uint256 public constant INTEREST_RATE = 500; // 5% (basis points)
    uint256 public constant LOAN_TERM = 365 * 24 * 60 * 60; // 1 year in seconds
    uint256 public constant PROPERTY_VALUE = 120_000 * 10**6; // 120,000 USDT

    function setUp() public {
        // Deploy USDT mock contract
        usdtToken = IERC20(address(new MockERC20("USDT", "USDT", 6)));

        // Deploy mortgage contract
        vm.prank(owner);
        mortgageContract = new MortgageContract(
            borrower,
            LOAN_AMOUNT,
            address(usdtToken),
            INTEREST_RATE,
            LOAN_TERM,
            "Test Property - 123 Main St",
            operator
        );

        // Fund test accounts with USDT
        deal(address(usdtToken), investor1, 50_000 * 10**6);
        deal(address(usdtToken), investor2, 75_000 * 10**6);
        deal(address(usdtToken), investor3, 100_000 * 10**6);
        deal(address(usdtToken), operator, 200_000 * 10**6);

        // Approve contract to spend USDT
        vm.startPrank(investor1);
        usdtToken.approve(address(mortgageContract), 50_000 * 10**6);
        vm.stopPrank();

        vm.startPrank(investor2);
        usdtToken.approve(address(mortgageContract), 75_000 * 10**6);
        vm.stopPrank();

        vm.startPrank(investor3);
        usdtToken.approve(address(mortgageContract), 100_000 * 10**6);
        vm.stopPrank();

        vm.startPrank(operator);
        usdtToken.approve(address(mortgageContract), 200_000 * 10**6);
        vm.stopPrank();

        // Grant INVESTOR_ROLE to test investors
        vm.prank(owner);
        mortgageContract.grantRole(mortgageContract.INVESTOR_ROLE(), investor1);

        vm.prank(owner);
        mortgageContract.grantRole(mortgageContract.INVESTOR_ROLE(), investor2);

        vm.prank(owner);
        mortgageContract.grantRole(mortgageContract.INVESTOR_ROLE(), investor3);
    }

    // ========================================
    // PORTFOLIO METRICS TESTS
    // ========================================

    function testGetPortfolioMetrics_InitialState() public view {
        (
            uint256 totalFunded,
            uint256 totalInvestors,
            uint256 activeContracts,
            uint256 totalPrincipalRepaid,
            uint256 totalInterestPaid,
            uint256 totalValueLocked
        ) = mortgageContract.getPortfolioMetrics();

        assertEq(totalFunded, 0, "Initial total funded should be 0");
        assertEq(totalInvestors, 0, "Initial total investors should be 0");
        assertEq(activeContracts, 0, "Initial active contracts should be 0");
        assertEq(totalPrincipalRepaid, 0, "Initial principal repaid should be 0");
        assertEq(totalInterestPaid, 0, "Initial interest paid should be 0");
        assertEq(totalValueLocked, 0, "Initial value locked should be 0");
    }

    function testGetPortfolioMetrics_AfterFunding() public {
        // Start funding and make investments
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.prank(investor1);
        mortgageContract.invest(30_000 * 10**6);

        vm.prank(investor2);
        mortgageContract.invest(40_000 * 10**6);

        vm.prank(investor3);
        mortgageContract.invest(30_000 * 10**6);

        (
            uint256 totalFunded,
            uint256 totalInvestors,
            uint256 activeContracts,
            uint256 totalPrincipalRepaid,
            uint256 totalInterestPaid,
            uint256 totalValueLocked
        ) = mortgageContract.getPortfolioMetrics();

        assertEq(totalFunded, 100_000 * 10**6, "Total funded should match investments");
        assertEq(totalInvestors, 3, "Should have 3 investors");
        assertEq(activeContracts, 1, "Should have 1 active contract (funded stage)");
        assertEq(totalPrincipalRepaid, 0, "No principal repaid yet");
        assertEq(totalInterestPaid, 0, "No interest paid yet");
        assertEq(totalValueLocked, 100_000 * 10**6, "Value locked should equal total funded");
    }

    function testGetPortfolioMetrics_AfterActive() public {
        // Progress to active stage
        _progressToActiveStage();

        (
            uint256 totalFunded,
            uint256 totalInvestors,
            uint256 activeContracts,
            uint256 totalPrincipalRepaid,
            uint256 totalInterestPaid,
            uint256 totalValueLocked
        ) = mortgageContract.getPortfolioMetrics();

        assertEq(totalFunded, 100_000 * 10**6, "Total funded should be 100k");
        assertEq(totalInvestors, 3, "Should have 3 investors");
        assertEq(activeContracts, 1, "Should have 1 active contract");
        assertEq(totalPrincipalRepaid, 0, "No principal repaid yet");
        assertEq(totalInterestPaid, 0, "No interest paid yet");
        assertEq(totalValueLocked, 100_000 * 10**6, "Value locked should be total funded");
    }

    function testGetPortfolioMetrics_AfterRepayments() public {
        // Progress to active stage and make repayments
        _progressToActiveStage();

        // Make partial repayment
        vm.prank(operator);
        mortgageContract.depositPrincipal(20_000 * 10**6);

        vm.prank(operator);
        mortgageContract.depositInterest(2_000 * 10**6);

        (
            uint256 totalFunded,
            uint256 totalInvestors,
            uint256 activeContracts,
            uint256 totalPrincipalRepaid,
            uint256 totalInterestPaid,
            uint256 totalValueLocked
        ) = mortgageContract.getPortfolioMetrics();

        assertEq(totalFunded, 100_000 * 10**6, "Total funded should be 100k");
        assertEq(totalInvestors, 3, "Should have 3 investors");
        assertEq(activeContracts, 1, "Should have 1 active contract");
        assertEq(totalPrincipalRepaid, 20_000 * 10**6, "Should have 20k principal repaid");
        assertEq(totalInterestPaid, 2_000 * 10**6, "Should have 2k interest paid");
        assertEq(totalValueLocked, 78_000 * 10**6, "Value locked should be remaining funds");
    }

    // ========================================
    // CONTRACT ANALYTICS TESTS
    // ========================================

    function testGetContractAnalytics_InitialState() public view {
        (
            uint256 fundingProgress,
            uint256 investorCount,
            uint256 averageInvestment,
            uint256 totalDistributed,
            uint256 repaymentRate,
            uint256 timeToCompletion
        ) = mortgageContract.getContractAnalytics();

        assertEq(fundingProgress, 0, "Initial funding progress should be 0%");
        assertEq(investorCount, 0, "Initial investor count should be 0");
        assertEq(averageInvestment, 0, "Initial average investment should be 0");
        assertEq(totalDistributed, 0, "Initial total distributed should be 0");
        assertEq(repaymentRate, 0, "Initial repayment rate should be 0%");
        assertEq(timeToCompletion, type(uint256).max, "Time to completion should be max uint");
    }

    function testGetContractAnalytics_DuringFunding() public {
        // Start funding and make partial investment
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.prank(investor1);
        mortgageContract.invest(30_000 * 10**6);

        (
            uint256 fundingProgress,
            uint256 investorCount,
            uint256 averageInvestment,
            uint256 totalDistributed,
            uint256 repaymentRate,
            uint256 timeToCompletion
        ) = mortgageContract.getContractAnalytics();

        assertEq(fundingProgress, 3000, "Funding progress should be 30% (3000 basis points)");
        assertEq(investorCount, 1, "Should have 1 investor");
        assertEq(averageInvestment, 30_000 * 10**6, "Average investment should be 30k");
        assertEq(totalDistributed, 0, "No distributions yet");
        assertEq(repaymentRate, 0, "No repayment rate yet");
        assertEq(timeToCompletion, type(uint256).max, "Time to completion not applicable");
    }

    function testGetContractAnalytics_FullyFunded() public {
        // Fully fund the contract
        _progressToFundedStage();

        (
            uint256 fundingProgress,
            uint256 investorCount,
            uint256 averageInvestment,
            uint256 totalDistributed,
            uint256 repaymentRate,
            uint256 timeToCompletion
        ) = mortgageContract.getContractAnalytics();

        assertEq(fundingProgress, 10000, "Funding progress should be 100% (10000 basis points)");
        assertEq(investorCount, 3, "Should have 3 investors");
        assertEq(averageInvestment, 33_333 * 10**6, "Average investment should be ~33.3k");
        assertEq(totalDistributed, 0, "No distributions yet");
        assertEq(repaymentRate, 0, "No repayment rate yet");
        assertEq(timeToCompletion, type(uint256).max, "Time to completion not applicable yet");
    }

    function testGetContractAnalytics_AfterRepayments() public {
        // Progress to active stage and make repayments
        _progressToActiveStage();

        vm.prank(operator);
        mortgageContract.depositPrincipal(30_000 * 10**6);

        (
            uint256 fundingProgress,
            uint256 investorCount,
            uint256 averageInvestment,
            uint256 totalDistributed,
            uint256 repaymentRate,
            uint256 timeToCompletion
        ) = mortgageContract.getContractAnalytics();

        assertEq(fundingProgress, 10000, "Funding progress should be 100%");
        assertEq(investorCount, 3, "Should have 3 investors");
        assertEq(totalDistributed, 30_000 * 10**6, "Total distributed should equal principal repaid");
        assertEq(repaymentRate, 3000, "Repayment rate should be 30% (3000 basis points)");
        assertTrue(timeToCompletion > 0, "Time to completion should be estimated");
        assertTrue(timeToCompletion < type(uint256).max, "Time to completion should be finite");
    }

    // ========================================
    // INVESTOR BREAKDOWN TESTS
    // ========================================

    function testGetInvestorBreakdown_InitialState() public view {
        (
            address[] memory investors,
            uint256[] memory shares,
            uint256[] memory percentages,
            uint256[] memory withdrawableAmounts
        ) = mortgageContract.getInvestorBreakdown();

        assertEq(investors.length, 0, "Initial investors array should be empty");
        assertEq(shares.length, 0, "Initial shares array should be empty");
        assertEq(percentages.length, 0, "Initial percentages array should be empty");
        assertEq(withdrawableAmounts.length, 0, "Initial withdrawable amounts array should be empty");
    }

    function testGetInvestorBreakdown_AfterInvestments() public {
        // Make investments
        _progressToFundedStage();

        (
            address[] memory investors,
            uint256[] memory shares,
            uint256[] memory percentages,
            uint256[] memory withdrawableAmounts
        ) = mortgageContract.getInvestorBreakdown();

        // Note: This test expects empty arrays due to simplified implementation
        // In a full implementation, this would return actual investor data
        assertEq(investors.length, 3, "Should return array of length 3");
        assertEq(shares.length, 3, "Should return shares array of length 3");
        assertEq(percentages.length, 3, "Should return percentages array of length 3");
        assertEq(withdrawableAmounts.length, 3, "Should return withdrawable amounts array of length 3");
    }

    // ========================================
    // PERFORMANCE METRICS TESTS
    // ========================================

    function testGetPerformanceMetrics_InitialState() public view {
        (
            uint256 totalInvested,
            uint256 totalDistributed,
            uint256 investmentRate,
            uint256 distributionRate,
            uint256 efficiencyScore
        ) = mortgageContract.getPerformanceMetrics();

        assertEq(totalInvested, 0, "Initial total invested should be 0");
        assertEq(totalDistributed, 0, "Initial total distributed should be 0");
        assertEq(investmentRate, 0, "Initial investment rate should be 0");
        assertEq(distributionRate, 0, "Initial distribution rate should be 0");
        assertEq(efficiencyScore, 0, "Initial efficiency score should be 0");
    }

    function testGetPerformanceMetrics_AfterFunding() public {
        // Start funding and make investments
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.prank(investor1);
        mortgageContract.invest(50_000 * 10**6);

        // Fast forward time to create duration for rate calculations
        vm.warp(block.timestamp + 1 days);

        (
            uint256 totalInvested,
            uint256 totalDistributed,
            uint256 investmentRate,
            uint256 distributionRate,
            uint256 efficiencyScore
        ) = mortgageContract.getPerformanceMetrics();

        assertEq(totalInvested, 50_000 * 10**6, "Total invested should be 50k");
        assertEq(totalDistributed, 0, "No distributions yet");
        assertTrue(investmentRate > 0, "Investment rate should be positive after time passes");
        assertEq(distributionRate, 0, "Distribution rate should be 0 when no distributions");
        assertTrue(efficiencyScore > 0, "Efficiency score should be positive with investments");
    }

    function testGetPerformanceMetrics_AfterActive() public {
        // Progress to active stage
        _progressToActiveStage();

        // Fast forward time for rate calculations
        vm.warp(block.timestamp + 30 days);

        (
            uint256 totalInvested,
            uint256 totalDistributed,
            uint256 investmentRate,
            uint256 distributionRate,
            uint256 efficiencyScore
        ) = mortgageContract.getPerformanceMetrics();

        assertEq(totalInvested, 100_000 * 10**6, "Total invested should be 100k");
        assertEq(totalDistributed, 0, "No distributions yet");
        assertTrue(investmentRate > 0, "Investment rate should be positive");
        assertEq(distributionRate, 0, "Distribution rate should be 0 initially");
        assertTrue(efficiencyScore > 0, "Efficiency score should be positive");
        assertTrue(efficiencyScore <= 10000, "Efficiency score should be capped at 100% (10000 basis points)");
    }

    // ========================================
    // COMPLIANCE METRICS TESTS
    // ========================================

    function testGetComplianceMetrics_InitialState() public view {
        (
            string[] memory regulatoryFlags,
            uint256 riskScore,
            uint256 complianceScore,
            uint256 auditScore
        ) = mortgageContract.getComplianceMetrics();

        assertEq(regulatoryFlags.length, 3, "Should have 3 regulatory flags");
        assertEq(regulatoryFlags[0], "INACTIVE_CONTRACT", "Should be inactive initially");
        assertEq(regulatoryFlags[1], "SINGLE_INVESTOR", "Should be single investor initially");
        assertEq(regulatoryFlags[2], "PARTIALLY_FUNDED", "Should be partially funded initially");

        assertTrue(riskScore > 0, "Risk score should be positive");
        assertTrue(riskScore <= 10000, "Risk score should be capped at 10000");
        assertEq(complianceScore, 9000, "Compliance score should be 90% (10000 - 1000 for not started)");
        assertEq(auditScore, 5000, "Audit score should be 50% (no stage changes tracked)");
    }

    function testGetComplianceMetrics_AfterFunding() public {
        // Start funding and make investments
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.prank(investor1);
        mortgageContract.invest(50_000 * 10**6);

        vm.prank(investor2);
        mortgageContract.invest(50_000 * 10**6);

        (
            string[] memory regulatoryFlags,
            uint256 riskScore,
            uint256 complianceScore,
            uint256 auditScore
        ) = mortgageContract.getComplianceMetrics();

        assertEq(regulatoryFlags.length, 3, "Should have 3 regulatory flags");
        assertEq(regulatoryFlags[0], "FUNDED_CONTRACT", "Should be funded");
        assertEq(regulatoryFlags[1], "SINGLE_INVESTOR", "Should be single investor with 2 investors");
        assertEq(regulatoryFlags[2], "FULLY_FUNDED", "Should be fully funded");

        assertTrue(riskScore < 7500, "Risk score should be lower when fully funded");
        assertEq(complianceScore, 10000, "Compliance score should be perfect when funded");
        assertTrue(auditScore > 5000, "Audit score should improve with stage changes");
    }

    function testGetComplianceMetrics_MultiInvestor() public {
        // Start funding and get multiple investors
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.prank(investor1);
        mortgageContract.invest(30_000 * 10**6);

        vm.prank(investor2);
        mortgageContract.invest(30_000 * 10**6);

        vm.prank(investor3);
        mortgageContract.invest(30_000 * 10**6);

        (
            string[] memory regulatoryFlags,
            uint256 riskScore,
            uint256 complianceScore,
            uint256 auditScore
        ) = mortgageContract.getComplianceMetrics();

        assertEq(regulatoryFlags[1], "MULTI_INVESTOR", "Should be multi investor with 3+ investors");
        assertTrue(riskScore < 9500, "Risk score should be lower with multiple investors");
    }

    // ========================================
    // EVENT TIMELINE TESTS
    // ========================================

    function testGetEventTimeline_InitialState() public view {
        (
            uint256[] memory timestamps,
            string[] memory events,
            uint256[] memory amounts
        ) = mortgageContract.getEventTimeline();

        assertEq(timestamps.length, 1, "Initial timeline should have 1 event (creation)");
        assertEq(events.length, 1, "Initial timeline should have 1 event");
        assertEq(amounts.length, 1, "Initial timeline should have 1 amount");

        assertEq(timestamps[0], mortgageContract.createdAt(), "First timestamp should be creation time");
        assertEq(events[0], "Contract Created", "First event should be creation");
        assertEq(amounts[0], LOAN_AMOUNT, "First amount should be loan amount");
    }

    function testGetEventTimeline_AfterFunding() public {
        // Start funding
        vm.prank(operator);
        mortgageContract.startFunding();

        (
            uint256[] memory timestamps,
            string[] memory events,
            uint256[] memory amounts
        ) = mortgageContract.getEventTimeline();

        assertEq(timestamps.length, 2, "Timeline should have 2 events");
        assertEq(events.length, 2, "Timeline should have 2 events");
        assertEq(amounts.length, 2, "Timeline should have 2 amounts");

        assertEq(events[1], "Funding phase started by operator", "Second event should be funding start");
        assertEq(amounts[1], 0, "Second amount should be 0 (stage change)");
    }

    function testGetEventTimeline_AfterFundingComplete() public {
        // Complete funding
        _progressToFundedStage();

        (
            uint256[] memory timestamps,
            string[] memory events,
            uint256[] memory amounts
        ) = mortgageContract.getEventTimeline();

        assertEq(timestamps.length, 3, "Timeline should have 3 events");
        assertEq(events.length, 3, "Timeline should have 3 events");
        assertEq(amounts.length, 3, "Timeline should have 3 amounts");

        assertEq(events[1], "Funding phase started by operator", "Second event should be funding start");
        assertEq(events[2], "Funding target reached", "Third event should be funding complete");
        assertEq(amounts[2], 100_000 * 10**6, "Third amount should be total funded");
    }

    function testGetEventTimeline_AfterActive() public {
        // Progress to active stage
        _progressToActiveStage();

        (
            uint256[] memory timestamps,
            string[] memory events,
            uint256[] memory amounts
        ) = mortgageContract.getEventTimeline();

        assertEq(timestamps.length, 4, "Timeline should have 4 events");
        assertEq(events.length, 4, "Timeline should have 4 events");
        assertEq(amounts.length, 4, "Timeline should have 4 amounts");

        assertEq(events[3], "Loan fully withdrawn to borrower", "Fourth event should be loan withdrawal");
        assertEq(amounts[3], LOAN_AMOUNT, "Fourth amount should be loan amount withdrawn");
    }

    // ========================================
    // GAS EFFICIENCY TESTS
    // ========================================

    function testGasEfficiency_GetPortfolioMetrics() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        uint256 gasBefore = gasleft();
        mortgageContract.getPortfolioMetrics();
        uint256 gasUsed = gasBefore - gasleft();

        // Target: < 50,000 gas for portfolio metrics query
        assertTrue(gasUsed < 50000, string(abi.encodePacked("Gas used too high: ", vm.toString(gasUsed))));
    }

    function testGasEfficiency_GetContractAnalytics() public {
        _progressToActiveStage();

        uint256 gasBefore = gasleft();
        mortgageContract.getContractAnalytics();
        uint256 gasUsed = gasBefore - gasleft();

        // Target: < 100,000 gas for contract analytics query
        assertTrue(gasUsed < 100000, string(abi.encodePacked("Gas used too high: ", vm.toString(gasUsed))));
    }

    function testGasEfficiency_GetComplianceMetrics() public {
        _progressToActiveStage();

        uint256 gasBefore = gasleft();
        mortgageContract.getComplianceMetrics();
        uint256 gasUsed = gasBefore - gasleft();

        // Target: < 75,000 gas for compliance metrics query
        assertTrue(gasUsed < 75000, string(abi.encodePacked("Gas used too high: ", vm.toString(gasUsed))));
    }

    // ========================================
    // EDGE CASES AND ERROR HANDLING TESTS
    // ========================================

    function testMetricsAccuracy_BoundaryConditions() public {
        // Test with maximum loan amount
        uint256 maxLoan = type(uint128).max;

        vm.prank(owner);
        MortgageContract maxContract = new MortgageContract(
            borrower,
            maxLoan,
            address(usdtToken),
            INTEREST_RATE,
            LOAN_TERM,
            "Max Property Test",
            operator
        );

        (
            uint256 fundingProgress,
            ,
            ,
            ,
            ,
        ) = maxContract.getContractAnalytics();

        assertEq(fundingProgress, 0, "Funding progress should handle max loan amount");

        // Test with zero investor count
        (
            ,
            uint256 investorCount,
            ,
            ,
            ,
        ) = maxContract.getContractAnalytics();

        assertEq(investorCount, 0, "Investor count should be zero initially");

        // Test with zero total funded
        (
            ,
            ,
            uint256 averageInvestment,
            ,
            ,
        ) = maxContract.getContractAnalytics();

        assertEq(averageInvestment, 0, "Average investment should be zero when no investors");
    }

    function testMetricsConsistency_MultipleCalls() public {
        // Make multiple calls to ensure consistency
        _progressToActiveStage();

        // First call
        (
            uint256 totalFunded1,
            uint256 totalInvestors1,
            ,
            uint256 totalPrincipalRepaid1,
            ,
        ) = mortgageContract.getPortfolioMetrics();

        // Second call
        (
            uint256 totalFunded2,
            uint256 totalInvestors2,
            ,
            uint256 totalPrincipalRepaid2,
            ,
        ) = mortgageContract.getPortfolioMetrics();

        // Results should be consistent
        assertEq(totalFunded1, totalFunded2, "Total funded should be consistent across calls");
        assertEq(totalInvestors1, totalInvestors2, "Total investors should be consistent across calls");
        assertEq(totalPrincipalRepaid1, totalPrincipalRepaid2, "Principal repaid should be consistent across calls");
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    function _progressToFundedStage() internal {
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.prank(investor1);
        mortgageContract.invest(30_000 * 10**6);

        vm.prank(investor2);
        mortgageContract.invest(40_000 * 10**6);

        vm.prank(investor3);
        mortgageContract.invest(30_000 * 10**6);
    }

    function _progressToActiveStage() internal {
        _progressToFundedStage();

        vm.prank(operator);
        mortgageContract.withdrawLoan(LOAN_AMOUNT);
    }
}

// Mock ERC20 contract for testing
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}