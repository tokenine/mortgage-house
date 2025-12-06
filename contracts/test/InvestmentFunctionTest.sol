// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MortgageContract.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

contract InvestmentFunctionTest is Test {
    MortgageContract public mortgageContract;
    IERC20 public usdt;

    address public owner;
    address public masterWallet;
    address public investor1;
    address public investor2;
    address public investor3;

    uint256 public constant USDT_DECIMALS = 6;
    uint256 public constant LOAN_AMOUNT = 100_000 * 10**USDT_DECIMALS; // 100k USDT
    uint256 public constant PROPERTY_VALUE = 150_000 * 10**USDT_DECIMALS; // 150k USDT
    uint256 public constant INTEREST_RATE = 800; // 8% (8 * 100)
    uint256 public constant LOAN_TERM = 365 days;
    uint256 public constant FUNDING_DEADLINE = 30 days;

    uint256 public INVESTOR_ROLE;
    uint256 public OPERATOR_ROLE;
    uint256 public MASTER_WALLET_ROLE;

    event Invested(address indexed investor, uint256 amount, uint256 shares);

    function setUp() public {
        // Setup accounts
        owner = address(this);
        masterWallet = makeAddr("masterWallet");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");
        investor3 = makeAddr("investor3");

        // Deploy mock USDT contract
        usdt = IERC20(deployMockUSDT());

        // Deploy MortgageContract
        mortgageContract = new MortgageContract();

        // Initialize contract
        bytes32[] memory roles = new bytes32[](3);
        roles[0] = keccak256("MASTER_WALLET_ROLE");
        roles[1] = keccak256("OPERATOR_ROLE");
        roles[2] = keccak256("INVESTOR_ROLE");

        address[] memory roleAddresses = new address[](3);
        roleAddresses[0] = masterWallet;
        roleAddresses[1] = masterWallet;
        roleAddresses[2] = investor1; // Grant investor role to investor1 for testing

        mortgageContract.initialize(
            PROPERTY_VALUE,
            LOAN_AMOUNT,
            INTEREST_RATE,
            LOAN_TERM,
            FUNDING_DEADLINE,
            address(usdt),
            roles,
            roleAddresses
        );

        // Get role constants
        INVESTOR_ROLE = mortgageContract.INVESTOR_ROLE();
        OPERATOR_ROLE = mortgageContract.OPERATOR_ROLE();
        MASTER_WALLET_ROLE = mortgageContract.MASTER_WALLET_ROLE();

        // Mint and distribute USDT to investors
        IERC20Permit(address(usdt)).mint(investor1, 10_000 * 10**USDT_DECIMALS);
        IERC20Permit(address(usdt)).mint(investor2, 10_000 * 10**USDT_DECIMALS);
        IERC20Permit(address(usdt)).mint(investor3, 10_000 * 10**USDT_DECIMALS);

        // Grant INVESTOR_ROLE to other investors
        vm.prank(masterWallet);
        mortgageContract.grantRole(INVESTOR_ROLE, investor2);

        vm.prank(masterWallet);
        mortgageContract.grantRole(INVESTOR_ROLE, investor3);
    }

    function deployMockUSDT() internal returns (address) {
        // Simple mock ERC20 USDT contract for testing
        return address(new MockUSDT());
    }

    function testInitialState() public view {
        assertEq(mortgageContract.totalFunded(), 0, "Total funded should be 0");
        assertEq(mortgageContract.totalShares(), 0, "Total shares should be 0");
        assertEq(mortgageContract.investorCount(), 0, "Investor count should be 0");
        assertEq(mortgageContract.stage(), 1, "Should be in funding stage");
    }

    function testInvestmentFailsWithoutInvestorRole() public {
        vm.startPrank(makeAddr("unauthorizedInvestor"));

        uint256 investmentAmount = 1_000 * 10**USDT_DECIMALS;

        // Approve USDT spending
        IERC20(address(usdt)).approve(address(mortgageContract), investmentAmount);

        // Investment should fail without INVESTOR_ROLE
        vm.expectRevert();
        mortgageContract.invest(investmentAmount);

        vm.stopPrank();
    }

    function testInvestmentFailsBelowMinimum() public {
        vm.startPrank(investor1);

        uint256 investmentAmount = 500_000; // 0.5 USDT (below 1 USDT minimum)

        // Approve USDT spending
        IERC20(address(usdt)).approve(address(mortgageContract), investmentAmount);

        // Investment should fail below minimum
        vm.expectRevert("Minimum investment is 1 USDT");
        mortgageContract.invest(investmentAmount);

        vm.stopPrank();
    }

    function testInvestmentFailsExceedsFundingCapacity() public {
        vm.startPrank(investor1);

        uint256 investmentAmount = LOAN_AMOUNT + 1_000 * 10**USDT_DECIMALS; // More than loan amount

        // Approve USDT spending
        IERC20(address(usdt)).approve(address(mortgageContract), investmentAmount);

        // Investment should fail if exceeds funding capacity
        vm.expectRevert("Exceeds funding capacity");
        mortgageContract.invest(investmentAmount);

        vm.stopPrank();
    }

    function testSuccessfulInvestment() public {
        vm.startPrank(investor1);

        uint256 investmentAmount = 10_000 * 10**USDT_DECIMALS; // 10k USDT

        // Approve USDT spending
        IERC20(address(usdt)).approve(address(mortgageContract), investmentAmount);

        // Expect Investment event
        vm.expectEmit(true, true, true, true);
        emit Invested(investor1, investmentAmount, investmentAmount); // 1 USDT = 1 share

        // Execute investment
        mortgageContract.invest(investmentAmount);

        // Verify contract state updated correctly
        assertEq(mortgageContract.totalFunded(), investmentAmount, "Total funded should match investment");
        assertEq(mortgageContract.totalShares(), investmentAmount, "Total shares should equal investment (1:1)");
        assertEq(mortgageContract.investorCount(), 1, "Investor count should be 1");
        assertEq(mortgageContract.shares(investor1), investmentAmount, "Investor should have correct shares");

        vm.stopPrank();
    }

    function testMultipleInvestments() public {
        uint256 investment1 = 5_000 * 10**USDT_DECIMALS; // 5k USDT
        uint256 investment2 = 10_000 * 10**USDT_DECIMALS; // 10k USDT
        uint256 investment3 = 15_000 * 10**USDT_DECIMALS; // 15k USDT

        // First investor
        vm.startPrank(investor1);
        IERC20(address(usdt)).approve(address(mortgageContract), investment1);
        mortgageContract.invest(investment1);
        vm.stopPrank();

        // Second investor
        vm.startPrank(investor2);
        IERC20(address(usdt)).approve(address(mortgageContract), investment2);
        mortgageContract.invest(investment2);
        vm.stopPrank();

        // Third investor
        vm.startPrank(investor3);
        IERC20(address(usdt)).approve(address(mortgageContract), investment3);
        mortgageContract.invest(investment3);
        vm.stopPrank();

        // Verify aggregated state
        uint256 totalInvested = investment1 + investment2 + investment3;
        assertEq(mortgageContract.totalFunded(), totalInvested, "Total funded should match all investments");
        assertEq(mortgageContract.totalShares(), totalInvested, "Total shares should equal total investment");
        assertEq(mortgageContract.investorCount(), 3, "Investor count should be 3");

        // Verify individual shares
        assertEq(mortgageContract.shares(investor1), investment1, "Investor1 should have correct shares");
        assertEq(mortgageContract.shares(investor2), investment2, "Investor2 should have correct shares");
        assertEq(mortgageContract.shares(investor3), investment3, "Investor3 should have correct shares");
    }

    function testInvestmentOwnershipPercentage() public {
        uint256 investment1 = 90_000 * 10**USDT_DECIMALS; // 90k USDT (90%)
        uint256 investment2 = 10_000 * 10**USDT_DECIMALS; // 10k USDT (10%)

        // First investor (90% ownership)
        vm.startPrank(investor1);
        IERC20(address(usdt)).approve(address(mortgageContract), investment1);
        mortgageContract.invest(investment1);
        vm.stopPrank();

        // Second investor (10% ownership)
        vm.startPrank(investor2);
        IERC20(address(usdt)).approve(address(mortgageContract), investment2);
        mortgageContract.invest(investment2);
        vm.stopPrank();

        uint256 totalShares = investment1 + investment2;

        // Test ownership percentage calculation
        uint256 investor1Percentage = (mortgageContract.shares(investor1) * 10000) / totalShares;
        uint256 investor2Percentage = (mortgageContract.shares(investor2) * 10000) / totalShares;

        assertEq(investor1Percentage, 9000, "Investor1 should own 90%");
        assertEq(investor2Percentage, 1000, "Investor2 should own 10%");
    }

    function testInvestmentWithZeroUSDTBalance() public {
        // Use an investor with no USDT balance
        address poorInvestor = makeAddr("poorInvestor");

        vm.prank(masterWallet);
        mortgageContract.grantRole(INVESTOR_ROLE, poorInvestor);

        vm.startPrank(poorInvestor);

        uint256 investmentAmount = 1_000 * 10**USDT_DECIMALS; // 1k USDT

        // Approve more than they have (will succeed)
        IERC20(address(usdt)).approve(address(mortgageContract), investmentAmount);

        // Investment should fail due to insufficient USDT balance
        vm.expectRevert();
        mortgageContract.invest(investmentAmount);

        vm.stopPrank();
    }

    function testGetRemainingFunding() public view {
        assertEq(mortgageContract.getRemainingFunding(), LOAN_AMOUNT, "Remaining funding should equal loan amount initially");
    }

    function testGetRemainingFundingAfterInvestment() public {
        vm.startPrank(investor1);

        uint256 investmentAmount = 20_000 * 10**USDT_DECIMALS; // 20k USDT
        uint256 expectedRemaining = LOAN_AMOUNT - investmentAmount;

        IERC20(address(usdt)).approve(address(mortgageContract), investmentAmount);
        mortgageContract.invest(investmentAmount);

        assertEq(mortgageContract.getRemainingFunding(), expectedRemaining, "Remaining funding should decrease after investment");

        vm.stopPrank();
    }

    function testInvestmentProgressCalculation() public {
        uint256 investment1 = 25_000 * 10**USDT_DECIMALS; // 25% of loan
        uint256 investment2 = 50_000 * 10**USDT_DECIMALS; // 50% of loan

        // First investment
        vm.startPrank(investor1);
        IERC20(address(usdt)).approve(address(mortgageContract), investment1);
        mortgageContract.invest(investment1);
        vm.stopPrank();

        // Progress should be 25%
        uint256 progress1 = (mortgageContract.totalFunded() * 10000) / LOAN_AMOUNT;
        assertEq(progress1, 2500, "Progress should be 25% after first investment");

        // Second investment
        vm.startPrank(investor2);
        IERC20(address(usdt)).approve(address(mortgageContract), investment2);
        mortgageContract.invest(investment2);
        vm.stopPrank();

        // Progress should be 75%
        uint256 progress2 = (mortgageContract.totalFunded() * 10000) / LOAN_AMOUNT;
        assertEq(progress2, 7500, "Progress should be 75% after second investment");
    }
}

// Mock USDT contract for testing
contract MockUSDT {
    string public name = "Mock USDT";
    string public symbol = "USDT";
    uint8 public decimals = 6;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "ERC20: transfer amount exceeds balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "ERC20: transfer amount exceeds balance");
        require(allowance[from][msg.sender] >= amount, "ERC20: insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    // Permit functions for IERC20Permint compatibility
    function permit(
        address /* owner */,
        address /* spender */,
        uint256 /* value */,
        uint256 /* deadline */,
        uint8 /* v */,
        bytes32 /* r */,
        bytes32 /* s */
    ) external pure {
        // Mock implementation - does nothing
    }

    function nonces(address /* owner */) external pure returns (uint256) {
        return 0;
    }

    function DOMAIN_SEPARATOR() external pure returns (bytes32) {
        return bytes32(0);
    }
}