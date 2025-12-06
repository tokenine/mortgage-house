// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MortgageContract.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StageManagementTest is Test {
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
    // BASIC STAGE MANAGEMENT TESTS
    // ========================================

    function testInitialState() public view {
        assertEq(uint8(mortgageContract.stage()), uint8(MortgageContract.Stage.NOT_STARTED));
        assertEq(mortgageContract.lastStageChangedBy(), address(0));
        assertEq(mortgageContract.lastStageChangeTime(), 0);
    }

    function testStartFunding() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        assertEq(uint8(mortgageContract.stage()), uint8(MortgageContract.Stage.FUNDING));
        assertEq(mortgageContract.lastStageChangedBy(), operator);
        assertEq(mortgageContract.stageTimestamps(MortgageContract.Stage.FUNDING), block.timestamp);
        assertEq(mortgageContract.stageReasons(MortgageContract.Stage.FUNDING), "Funding phase started by operator");
    }

    function testCannotStartFundingAsNonOperator() public {
        vm.expectRevert("AccessControl: account 0x4 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6");
        vm.prank(investor1);
        mortgageContract.startFunding();
    }

    function testCannotStartFundingTwice() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.expectRevert("Contract already started");
        vm.prank(operator);
        mortgageContract.startFunding();
    }

    // ========================================
    // STAGE TRANSITION VALIDATION TESTS
    // ========================================

    function testValidateStageTransition_NotStartedToFunding() public {
        assertTrue(mortgageContract.validateStageTransition(MortgageContract.Stage.NOT_STARTED, MortgageContract.Stage.FUNDING));
        assertFalse(mortgageContract.validateStageTransition(MortgageContract.Stage.NOT_STARTED, MortgageContract.Stage.FUNDED));
        assertFalse(mortgageContract.validateStageTransition(MortgageContract.Stage.NOT_STARTED, MortgageContract.Stage.ACTIVE));
    }

    function testValidateStageTransition_FundingToFunded() public {
        // Start funding first
        vm.prank(operator);
        mortgageContract.startFunding();

        // Should not allow transition until fully funded
        assertFalse(mortgageContract.validateStageTransition(MortgageContract.Stage.FUNDING, MortgageContract.Stage.FUNDED));

        // Invest to reach funding target
        vm.prank(investor1);
        mortgageContract.invest(50_000 * 10**6);

        vm.prank(investor2);
        mortgageContract.invest(50_000 * 10**6);

        // Now should allow transition
        assertTrue(mortgageContract.validateStageTransition(MortgageContract.Stage.FUNDING, MortgageContract.Stage.FUNDED));
    }

    function testValidateStageTransition_FundedToActive() public {
        // Progress to FUNDED stage
        _progressToFundedStage();

        // Should not allow transition to ACTIVE until loan fully withdrawn
        assertFalse(mortgageContract.validateStageTransition(MortgageContract.Stage.FUNDED, MortgageContract.Stage.ACTIVE));

        // Withdraw full loan amount
        vm.prank(operator);
        mortgageContract.withdrawLoan(LOAN_AMOUNT);

        // Now should allow transition
        assertTrue(mortgageContract.validateStageTransition(MortgageContract.Stage.FUNDED, MortgageContract.Stage.ACTIVE));
    }

    function testValidateStageTransition_ActiveToRepaid() public {
        // Progress to ACTIVE stage
        _progressToActiveStage();

        // Should not allow transition to REPAID until principal fully repaid
        assertFalse(mortgageContract.validateStageTransition(MortgageContract.Stage.ACTIVE, MortgageContract.Stage.REPAID));

        // Repay full principal
        vm.prank(operator);
        mortgageContract.depositPrincipal(LOAN_AMOUNT);

        // Now should allow transition
        assertTrue(mortgageContract.validateStageTransition(MortgageContract.Stage.ACTIVE, MortgageContract.Stage.REPAID));
    }

    // ========================================
    // MANUAL STAGE OVERRIDE TESTS
    // ========================================

    function testSetStageManual() public {
        // Start funding first
        vm.prank(operator);
        mortgageContract.startFunding();

        // Invest to reach funding target
        vm.prank(investor1);
        mortgageContract.invest(LOAN_AMOUNT);

        // Manually set to FUNDED stage
        vm.prank(operator);
        mortgageContract.setStage(MortgageContract.Stage.FUNDED, "Manual transition for testing");

        assertEq(uint8(mortgageContract.stage()), uint8(MortgageContract.Stage.FUNDED));
        assertEq(mortgageContract.lastStageChangedBy(), operator);
        assertEq(mortgageContract.stageReasons(MortgageContract.Stage.FUNDED), "Manual transition for testing");
    }

    function testCannotSetStageWithoutOperatorRole() public {
        vm.expectRevert("AccessControl: account 0x4 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6");
        vm.prank(investor1);
        mortgageContract.setStage(MortgageContract.Stage.FUNDING, "Unauthorized transition");
    }

    function testCannotSetStageToSameStage() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.expectRevert("Already in this stage");
        vm.prank(operator);
        mortgageContract.setStage(MortgageContract.Stage.FUNDING, "Same stage transition");
    }

    function testCannotSetStageWithInvalidTransition() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.expectRevert("Invalid stage transition");
        vm.prank(operator);
        mortgageContract.setStage(MortgageContract.Stage.REPAID, "Invalid transition");
    }

    function testCannotSetStageWithEmptyReason() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.expectRevert("Reason cannot be empty");
        vm.prank(operator);
        mortgageContract.setStage(MortgageContract.Stage.FUNDED, "");
    }

    // ========================================
    // AVAILABLE TRANSITIONS TESTS
    // ========================================

    function testGetAvailableTransitions_NotStarted() public {
        MortgageContract.Stage[] memory transitions = mortgageContract.getAvailableTransitions();
        assertEq(transitions.length, 1);
        assertEq(uint8(transitions[0]), uint8(MortgageContract.Stage.FUNDING));
    }

    function testGetAvailableTransitions_Funding() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        MortgageContract.Stage[] memory transitions = mortgageContract.getAvailableTransitions();
        assertEq(transitions.length, 0); // No transitions until fully funded
    }

    function testGetAvailableTransitions_FullyFunded() public {
        _progressToFundedStage();

        MortgageContract.Stage[] memory transitions = mortgageContract.getAvailableTransitions();
        assertEq(transitions.length, 1);
        assertEq(uint8(transitions[0]), uint8(MortgageContract.Stage.ACTIVE));
    }

    // ========================================
    // STAGE DURATION TESTS
    // ========================================

    function testGetStageDuration_CurrentStage() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        // Skip some time
        vm.warp(100);

        uint256 duration = mortgageContract.getStageDuration(MortgageContract.Stage.FUNDING);
        assertEq(duration, 100);
    }

    function testGetStageDuration_CompletedStage() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        uint256 startTime = block.timestamp;

        // Skip some time and transition to next stage
        vm.warp(100);
        _progressToFundedStage();

        uint256 duration = mortgageContract.getStageDuration(MortgageContract.Stage.FUNDING);
        assertEq(duration, 100);
    }

    function testGetStageDuration_NeverReachedStage() public {
        uint256 duration = mortgageContract.getStageDuration(MortgageContract.Stage.ACTIVE);
        assertEq(duration, 0);
    }

    // ========================================
    // EVENT EMISSION TESTS
    // ========================================

    function testStageChangedEventEmitted() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        vm.expectEmit(true, true, true, true);
        emit StageChanged(
            uint8(MortgageContract.Stage.FUNDING),
            uint8(MortgageContract.Stage.FUNDED),
            operator,
            "Manual test transition"
        );

        vm.prank(operator);
        mortgageContract.setStage(MortgageContract.Stage.FUNDED, "Manual test transition");
    }

    // ========================================
    // INTEGRATION WITH EXISTING FUNCTIONS TESTS
    // ========================================

    function testInvestionUpdatesStageHistory() public {
        vm.prank(operator);
        mortgageContract.startFunding();

        // Invest full amount to trigger automatic stage transition
        vm.prank(investor1);
        mortgageContract.invest(LOAN_AMOUNT);

        assertEq(uint8(mortgageContract.stage()), uint8(MortgageContract.Stage.FUNDED));
        assertEq(mortgageContract.lastStageChangedBy(), investor1);
        assertEq(mortgageContract.stageReasons(MortgageContract.Stage.FUNDED), "Funding target reached");
    }

    function testLoanWithdrawalUpdatesStageHistory() public {
        _progressToFundedStage();

        // Withdraw full loan amount to trigger automatic stage transition
        vm.prank(operator);
        mortgageContract.withdrawLoan(LOAN_AMOUNT);

        assertEq(uint8(mortgageContract.stage()), uint8(MortgageContract.Stage.ACTIVE));
        assertEq(mortgageContract.lastStageChangedBy(), operator);
        assertEq(mortgageContract.stageReasons(MortgageContract.Stage.ACTIVE), "Loan fully withdrawn to borrower");
    }

    function testPrincipalDepositUpdatesStageHistory() public {
        _progressToActiveStage();

        // Repay full principal to trigger automatic stage transition
        vm.prank(operator);
        mortgageContract.depositPrincipal(LOAN_AMOUNT);

        assertEq(uint8(mortgageContract.stage()), uint8(MortgageContract.Stage.REPAID));
        assertEq(mortgageContract.lastStageChangedBy(), operator);
        assertEq(mortgageContract.stageReasons(MortgageContract.Stage.REPAID), "Loan fully repaid by borrower");
    }

    // ========================================
    // EDGE CASES AND ERROR HANDLING TESTS
    // ========================================

    function testEmergencyCloseFromFundedStage() public {
        _progressToFundedStage();

        // Should allow emergency transition directly to REPAID
        assertTrue(mortgageContract.validateStageTransition(MortgageContract.Stage.FUNDED, MortgageContract.Stage.REPAID));

        vm.prank(operator);
        mortgageContract.setStage(MortgageContract.Stage.REPAID, "Emergency closure due to special circumstances");

        assertEq(uint8(mortgageContract.stage()), uint8(MortgageContract.Stage.REPAID));
    }

    function testInvalidStageTransitions() public {
        // Test various invalid transitions
        assertFalse(mortgageContract.validateStageTransition(MortgageContract.Stage.FUNDING, MortgageContract.Stage.NOT_STARTED));
        assertFalse(mortgageContract.validateStageTransition(MortgageContract.Stage.FUNDED, MortgageContract.Stage.FUNDING));
        assertFalse(mortgageContract.validateStageTransition(MortgageContract.Stage.REPAID, MortgageContract.Stage.ACTIVE));
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    function _progressToFundedStage() internal {
        // Start funding
        vm.prank(operator);
        mortgageContract.startFunding();

        // Invest to reach funding target
        vm.prank(investor1);
        mortgageContract.invest(LOAN_AMOUNT);
    }

    function _progressToActiveStage() internal {
        _progressToFundedStage();

        // Withdraw full loan amount
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

event StageChanged(
    uint8 indexed oldStage,
    uint8 indexed newStage,
    address indexed changedBy,
    string reason
);