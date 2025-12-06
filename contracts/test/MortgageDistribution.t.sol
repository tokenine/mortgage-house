// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MortgageContract.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MortgageDistributionTest is Test {
    MortgageContract public mortgageContract;
    IERC20 public usdtToken;

    address public owner;
    address public operator;
    address public investor1;
    address public investor2;
    address public investor3;

    uint256 public constant LOAN_AMOUNT = 100_000 * 10**6; // 100k USDT
    uint256 public constant PROPERTY_VALUE = 150_000 * 10**6; // 150k property value
    uint256 public constant INTEREST_RATE = 500; // 5% basis points
    uint256 public constant LOAN_TERM = 365 days * 30; // 30 years
    uint256 public constant FUNDING_DEADLINE = 30 days;

    function setUp() public {
        // Setup test accounts
        owner = address(this);
        operator = makeAddr("operator");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");
        investor3 = makeAddr("investor3");

        // Deploy mock USDT token for testing
        usdtToken = IERC20(address(new MockUSDT()));

        // Deploy mortgage contract
        mortgageContract = new MortgageContract();

        // Setup roles
        bytes32[] memory roles = new bytes32[](2);
        address[] memory roleAddresses = new address[](2);
        roles[0] = mortgageContract.OPERATOR_ROLE();
        roles[1] = mortgageContract.INVESTOR_ROLE();
        roleAddresses[0] = operator;
        roleAddresses[1] = investor1; // Can be updated later

        // Initialize contract
        mortgageContract.initialize(
            PROPERTY_VALUE,
            LOAN_AMOUNT,
            INTEREST_RATE,
            LOAN_TERM,
            FUNDING_DEADLINE,
            address(usdtToken),
            roles,
            roleAddresses
        );

        // Mint USDT for testing
        vm.startPrank(owner);
        MockUSDT(address(usdtToken)).mint(operator, 200_000 * 10**6); // 200k for operator
        MockUSDT(address(usdtToken)).mint(investor1, 200_000 * 10**6); // 200k for each investor
        MockUSDT(address(usdtToken)).mint(investor2, 200_000 * 10**6);
        MockUSDT(address(usdtToken)).mint(investor3, 200_000 * 10**6);
        vm.stopPrank();

        // Approve USDT spending
        vm.startPrank(operator);
        usdtToken.approve(address(mortgageContract), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(investor1);
        usdtToken.approve(address(mortgageContract), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(investor2);
        usdtToken.approve(address(mortgageContract), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(investor3);
        usdtToken.approve(address(mortgageContract), type(uint256).max);
        vm.stopPrank();
    }

    function test_initialState() public view {
        assertEq(mortgageContract.principalRepaid(), 0);
        assertEq(mortgageContract.interestPaid(), 0);
        assertEq(mortgageContract.totalShares(), 0);
        assertEq(mortgageContract.totalFunded(), 0);
    }

    function test_investmentFlow() public {
        vm.startPrank(owner);
        mortgageContract.grantRole(mortgageContract.INVESTOR_ROLE(), investor1);
        mortgageContract.grantRole(mortgageContract.INVESTOR_ROLE(), investor2);
        mortgageContract.grantRole(mortgageContract.INVESTOR_ROLE(), investor3);
        vm.stopPrank();

        // Invest in different amounts
        vm.prank(investor1);
        mortgageContract.invest(30_000 * 10**6); // 30%

        vm.prank(investor2);
        mortgageContract.invest(50_000 * 10**6); // 50%

        vm.prank(investor3);
        mortgageContract.invest(20_000 * 10**6); // 20%

        // Verify investment distribution
        assertEq(mortgageContract.shares(investor1), 30_000 * 10**6);
        assertEq(mortgageContract.shares(investor2), 50_000 * 10**6);
        assertEq(mortgageContract.shares(investor3), 20_000 * 10**6);
        assertEq(mortgageContract.totalShares(), 100_000 * 10**6);
    }

    function test_principalDepositedEvent() public {
        _setupInvestments();

        uint256 depositAmount = 10_000 * 10**6; // 10k principal repayment

        vm.expectEmit(true, true, true, true);
        emit PrincipalDeposited(operator, depositAmount, depositAmount, (depositAmount * 1e6) / mortgageContract.totalShares());

        vm.prank(operator);
        mortgageContract.depositPrincipal(depositAmount);
    }

    function test_principalDistributionCalculations() public {
        _setupInvestments();

        uint256 totalPrincipal = 30_000 * 10**6; // 30k principal repayment

        vm.prank(operator);
        mortgageContract.depositPrincipal(totalPrincipal);

        // Verify pro-rata distribution
        // Investor 1: 30% shares = 9k entitled
        assertEq(mortgageContract.getEntitledPrincipal(investor1), 9_000 * 10**6);
        assertEq(mortgageContract.getWithdrawablePrincipal(investor1), 9_000 * 10**6);

        // Investor 2: 50% shares = 15k entitled
        assertEq(mortgageContract.getEntitledPrincipal(investor2), 15_000 * 10**6);
        assertEq(mortgageContract.getWithdrawablePrincipal(investor2), 15_000 * 10**6);

        // Investor 3: 20% shares = 6k entitled
        assertEq(mortgageContract.getEntitledPrincipal(investor3), 6_000 * 10**6);
        assertEq(mortgageContract.getWithdrawablePrincipal(investor3), 6_000 * 10**6);
    }

    function test_interestDistributionCalculations() public {
        _setupInvestments();

        uint256 totalInterest = 5_000 * 10**6; // 5k interest payment

        vm.prank(operator);
        mortgageContract.depositInterest(totalInterest);

        // Verify pro-rata distribution
        // Investor 1: 30% shares = 1.5k entitled
        assertEq(mortgageContract.getEntitledInterest(investor1), 1_500 * 10**6);
        assertEq(mortgageContract.getWithdrawableInterest(investor1), 1_500 * 10**6);

        // Investor 2: 50% shares = 2.5k entitled
        assertEq(mortgageContract.getEntitledInterest(investor2), 2_500 * 10**6);
        assertEq(mortgageContract.getWithdrawableInterest(investor2), 2_500 * 10**6);

        // Investor 3: 20% shares = 1k entitled
        assertEq(mortgageContract.getEntitledInterest(investor3), 1_000 * 10**6);
        assertEq(mortgageContract.getWithdrawableInterest(investor3), 1_000 * 10**6);
    }

    function test_multiplePartialRepayments() public {
        _setupInvestments();

        // First repayment: 10k principal + 500 interest
        vm.prank(operator);
        mortgageContract.depositPrincipal(10_000 * 10**6);
        vm.prank(operator);
        mortgageContract.depositInterest(500 * 10**6);

        // Second repayment: 5k principal + 250 interest
        vm.prank(operator);
        mortgageContract.depositPrincipal(5_000 * 10**6);
        vm.prank(operator);
        mortgageContract.depositInterest(250 * 10**6);

        // Verify accumulated entitlements
        assertEq(mortgageContract.getEntitledPrincipal(investor1), 4_500 * 10**6); // (15k * 30%)
        assertEq(mortgageContract.getEntitledInterest(investor1), 225 * 10**6); // (750 * 30%)
    }

    function test_partialWithdrawals() public {
        _setupInvestments();

        // Deposit principal
        vm.prank(operator);
        mortgageContract.depositPrincipal(10_000 * 10**6);

        // Partial withdrawal for investor1 (half of entitled amount)
        uint256 withdrawAmount = 3_000 * 10**6; // Should be entitled to 9k total
        vm.prank(investor1);
        mortgageContract.withdrawPrincipal(withdrawAmount);

        // Verify withdrawal tracking
        assertEq(mortgageContract.withdrawnPrincipal(investor1), withdrawAmount);
        assertEq(mortgageContract.getWithdrawablePrincipal(investor1), 6_000 * 10**6); // 9k - 3k = 6k remaining
    }

    function test_doubleWithdrawalPrevention() public {
        _setupInvestments();

        // Deposit small principal amount
        vm.prank(operator);
        mortgageContract.depositPrincipal(3_000 * 10**6);

        // Investor1 withdraws entitled amount
        uint256 entitledAmount = mortgageContract.getWithdrawablePrincipal(investor1);
        vm.prank(investor1);
        mortgageContract.withdrawPrincipal(entitledAmount);

        // Attempt to withdraw same amount again should fail
        vm.expectRevert("Insufficient withdrawable principal");
        vm.prank(investor1);
        mortgageContract.withdrawPrincipal(entitledAmount);
    }

    function test_edgeCases() public {
        _setupInvestments();

        // Test deposit with 0 amount (should fail)
        vm.expectRevert("Amount must be greater than zero");
        vm.prank(operator);
        mortgageContract.depositPrincipal(0);

        // Test withdraw with 0 amount (should fail)
        vm.expectRevert("Amount must be greater than zero");
        vm.prank(investor1);
        mortgageContract.withdrawPrincipal(0);

        // Test withdrawal by non-shareholder (should fail)
        address nonInvestor = makeAddr("nonInvestor");
        vm.startPrank(owner);
        mortgageContract.grantRole(mortgageContract.INVESTOR_ROLE(), nonInvestor);
        vm.stopPrank();

        vm.expectRevert("No shares owned");
        vm.prank(nonInvestor);
        mortgageContract.withdrawPrincipal(1 * 10**6);
    }

    function test_accessControl() public {
        _setupInvestments();

        // Test deposit functions restricted to OPERATOR_ROLE
        vm.expectRevert();
        mortgageContract.depositPrincipal(1_000 * 10**6);

        vm.expectRevert();
        mortgageContract.depositInterest(100 * 10**6);

        // Test withdrawal functions restricted to INVESTOR_ROLE
        address nonInvestor = makeAddr("nonInvestor");
        vm.expectRevert();
        vm.prank(nonInvestor);
        mortgageContract.withdrawPrincipal(1 * 10**6);
    }

    function test_withdrawalEvents() public {
        _setupInvestments();

        // Deposit principal and interest
        vm.prank(operator);
        mortgageContract.depositPrincipal(10_000 * 10**6);
        vm.prank(operator);
        mortgageContract.depositInterest(1_000 * 10**6);

        // Expect withdrawal events
        vm.expectEmit(true, true, true, true);
        emit PayoutWithdrawn(investor1, 3_000 * 10**6, 300 * 10**6);
        vm.expectEmit(true, true, true, true);
        emit Withdrawn(investor1, 3_000 * 10**6, 300 * 10**6);

        vm.prank(investor1);
        mortgageContract.withdrawPayout(3_000 * 10**6, 300 * 10**6);
    }

    function test_mathematicalAccuracy() public {
        _setupInvestments();

        // Test with exact decimal precision
        uint256 oddAmount = 123_456_789; // Non-round number
        vm.prank(operator);
        mortgageContract.depositPrincipal(oddAmount);

        // Verify calculation maintains precision
        uint256 entitled1 = mortgageContract.getEntitledPrincipal(investor1);
        uint256 entitled2 = mortgageContract.getEntitledPrincipal(investor2);
        uint256 entitled3 = mortgageContract.getEntitledPrincipal(investor3);

        // Sum of entitled amounts should equal total (minus precision loss)
        uint256 totalEntitled = entitled1 + entitled2 + entitled3;
        assertApproxEqAbs(totalEntitled, oddAmount, 100); // Allow small precision loss
    }

    function test_gasOptimization() public {
        _setupInvestments();

        // Measure gas consumption for key operations
        vm.startPrank(operator);
        uint256 gas1 = gasleft();
        mortgageContract.depositPrincipal(10_000 * 10**6);
        uint256 gasUsed1 = gas1 - gasleft();

        uint256 gas2 = gasleft();
        mortgageContract.depositInterest(1_000 * 10**6);
        uint256 gasUsed2 = gas2 - gasleft();
        vm.stopPrank();

        // Gas should be reasonable (< 0.01 ETH = ~10,000,000 gas)
        assertLt(gasUsed1, 500_000);
        assertLt(gasUsed2, 500_000);

        // Measure withdrawal gas
        vm.startPrank(investor1);
        uint256 gas3 = gasleft();
        mortgageContract.withdrawPrincipal(3_000 * 10**6);
        uint256 gasUsed3 = gas3 - gasleft();
        vm.stopPrank();

        assertLt(gasUsed3, 200_000);
    }

    function _setupInvestments() internal {
        vm.startPrank(owner);
        mortgageContract.grantRole(mortgageContract.INVESTOR_ROLE(), investor1);
        mortgageContract.grantRole(mortgageContract.INVESTOR_ROLE(), investor2);
        mortgageContract.grantRole(mortgageContract.INVESTOR_ROLE(), investor3);
        vm.stopPrank();

        vm.prank(investor1);
        mortgageContract.invest(30_000 * 10**6);

        vm.prank(investor2);
        mortgageContract.invest(50_000 * 10**6);

        vm.prank(investor3);
        mortgageContract.invest(20_000 * 10**6);
    }

    // Events for testing
    event PrincipalDeposited(address indexed from, uint256 amount, uint256 totalPrincipal, uint256 perShareAmount);
    event InterestDeposited(address indexed from, uint256 amount, uint256 totalInterest, uint256 perShareAmount);
    event PayoutWithdrawn(address indexed to, uint256 principalAmount, uint256 interestAmount);
    event Withdrawn(address indexed investor, uint256 principalAmount, uint256 interestAmount);
}

// Mock USDT token for testing
contract MockUSDT {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    uint8 public decimals = 6;
    string public name = "Mock USDT";
    string public symbol = "USDT";

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(balanceOf[from] >= amount, "Insufficient balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}