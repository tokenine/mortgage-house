// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MortgageContract.sol";

contract LoanOperationsTest is Test {
    MortgageContract public mortgageContract;

    // Test addresses
    address public operator = address(0x1);
    address public borrower = address(0x2);
    address public investor1 = address(0x3);
    address public investor2 = address(0x4);
    address public usdtToken = address(0x5);

    // Test parameters
    uint256 public loanAmount = 100_000 * 10**6; // 100,000 USDT
    uint256 public interestRate = 750; // 7.5% annual
    uint256 public loanTerm = 360; // 30 years
    string public propertyDescription = "Test Property - Modern 3-bedroom house";
    uint256 public investmentAmount1 = 60_000 * 10**6; // 60,000 USDT
    uint256 public investmentAmount2 = 40_000 * 10**6; // 40,000 USDT

    function setUp() public {
        // Deploy contract with constructor parameters
        vm.startPrank(operator);
        mortgageContract = new MortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription,
            operator
        );
        vm.stopPrank();

        // Fund operator with ETH for gas
        vm.deal(operator, 10 ether);
        vm.deal(borrower, 10 ether);

        // Mock USDT token for testing
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).balanceOf.selector, address(mortgageContract)),
            abi.encode(loanAmount)
        );
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).balanceOf.selector, operator),
            abi.encode(type(uint256).max)
        );
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transfer.selector, borrower, loanAmount),
            abi.encode(true)
        );
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transferFrom.selector, operator, address(mortgageContract), investmentAmount1),
            abi.encode(true)
        );
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transferFrom.selector, operator, address(mortgageContract), investmentAmount2),
            abi.encode(true)
        );

        // Setup funding
        vm.startPrank(operator);
        mortgageContract.startFunding();
        vm.stopPrank();

        // Simulate investments by directly manipulating state (in real scenario, this would go through invest() function)
        vm.startPrank(operator);
        // For testing purposes, we'll skip the actual investment flow and focus on loan operations
        mortgageContract.initialize(
            loanAmount,
            loanAmount,
            interestRate,
            loanTerm,
            block.timestamp + 90 days,
            usdtToken,
            new bytes32[](0),
            new address[](0)
        );
        vm.stopPrank();
    }

    function test_WithdrawLoan_ValidConditions() public {
        vm.startPrank(operator);

        // Verify initial state
        assertEq(mortgageContract.stage(), uint8(MortgageContract.Stage.FUNDED), "Contract should be in FUNDED stage");
        assertEq(mortgageContract.loanWithdrawn(), 0, "No loan should be withdrawn initially");
        assertEq(mortgageContract.totalRepaid(), 0, "No total repaid initially");

        // Expect LoanWithdrawn event
        vm.expectEmit(true, true, true, true, address(mortgageContract));
        emit MortgageContract.LoanWithdrawn(borrower, loanAmount, operator, block.timestamp);

        // Withdraw full loan amount
        mortgageContract.withdrawLoan(loanAmount);

        // Verify state updates
        assertEq(mortgageContract.loanWithdrawn(), loanAmount, "Full loan amount should be withdrawn");
        assertEq(mortgageContract.totalRepaid(), loanAmount, "Total repaid should include loan disbursement");
        assertEq(mortgageContract.stage(), uint8(MortgageContract.Stage.ACTIVE), "Contract should transition to ACTIVE stage");

        vm.stopPrank();
    }

    function test_WithdrawLoan_PartialWithdrawal() public {
        vm.startPrank(operator);

        uint256 partialAmount = 50_000 * 10**6; // 50,000 USDT

        // Expect LoanWithdrawn event
        vm.expectEmit(true, true, true, true, address(mortgageContract));
        emit MortgageContract.LoanWithdrawn(borrower, partialAmount, operator, block.timestamp);

        // Withdraw partial amount
        mortgageContract.withdrawLoan(partialAmount);

        // Verify state updates
        assertEq(mortgageContract.loanWithdrawn(), partialAmount, "Partial amount should be withdrawn");
        assertEq(mortgageContract.stage(), uint8(MortgageContract.Stage.FUNDED), "Contract should remain in FUNDED stage");

        // Withdraw remaining amount
        uint256 remainingAmount = loanAmount - partialAmount;
        mortgageContract.withdrawLoan(remainingAmount);

        // Verify final state
        assertEq(mortgageContract.loanWithdrawn(), loanAmount, "Full loan amount should be withdrawn");
        assertEq(mortgageContract.stage(), uint8(MortgageContract.Stage.ACTIVE), "Contract should transition to ACTIVE stage");

        vm.stopPrank();
    }

    function test_WithdrawLoan_InvalidStage() public {
        vm.startPrank(operator);

        // Test withdrawal in NOT_STARTED stage
        mortgageContract.initialize(
            loanAmount,
            loanAmount,
            interestRate,
            loanTerm,
            block.timestamp + 90 days,
            usdtToken,
            new bytes32[](0),
            new address[](0)
        );

        vm.expectRevert("Loan withdrawal only allowed after funding complete");
        mortgageContract.withdrawLoan(loanAmount);

        // Test withdrawal in ACTIVE stage
        // First transition to ACTIVE by withdrawing full amount
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transferFrom.selector, operator, address(mortgageContract), loanAmount),
            abi.encode(true)
        );
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transfer.selector, borrower, loanAmount),
            abi.encode(true)
        );

        mortgageContract.withdrawLoan(loanAmount);

        // Try to withdraw again in ACTIVE stage
        vm.expectRevert("Loan withdrawal only allowed after funding complete");
        mortgageContract.withdrawLoan(1000);

        vm.stopPrank();
    }

    function test_WithdrawLoan_InsufficientAmount() public {
        vm.startPrank(operator);

        vm.expectRevert("Amount must be greater than zero");
        mortgageContract.withdrawLoan(0);

        vm.expectRevert("Withdrawal exceeds loan amount");
        mortgageContract.withdrawLoan(loanAmount + 1);

        vm.stopPrank();
    }

    function test_WithdrawLoan_InsufficientBalance() public {
        vm.startPrank(operator);

        // Mock insufficient balance
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).balanceOf.selector, address(mortgageContract)),
            abi.encode(loanAmount - 1)
        );

        vm.expectRevert("Insufficient contract balance");
        mortgageContract.withdrawLoan(loanAmount);

        vm.stopPrank();
    }

    function test_DepositPrincipal_ValidAmount() public {
        // First, transition to ACTIVE stage
        vm.startPrank(operator);
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transferFrom.selector, operator, address(mortgageContract), loanAmount),
            abi.encode(true)
        );
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transfer.selector, borrower, loanAmount),
            abi.encode(true)
        );
        mortgageContract.withdrawLoan(loanAmount);

        // Mock investor shares for testing
        vm.store(
            address(mortgageContract),
            keccak256(abi.encode(investor1, uint256(1))), // shares mapping slot
            bytes32(uint256(60_000 * 10**6))
        );
        vm.store(
            address(mortgageContract),
            keccak256(abi.encode(investor2, uint256(1))), // shares mapping slot
            bytes32(uint256(40_000 * 10**6))
        );
        vm.store(
            address(mortgageContract),
            bytes32(uint256(2)), // totalShares slot
            bytes32(uint256(100_000 * 10**6))
        );

        uint256 principalAmount = 10_000 * 10**6; // 10,000 USDT

        // Expect PrincipalDeposited event
        vm.expectEmit(true, true, true, true, address(mortgageContract));
        emit MortgageContract.PrincipalDeposited(operator, principalAmount, principalAmount, (principalAmount * 1e6) / (100_000 * 10**6));

        // Deposit principal
        mortgageContract.depositPrincipal(principalAmount);

        // Verify state updates
        assertEq(mortgageContract.principalRepaid(), principalAmount, "Principal repaid should be updated");
        assertEq(mortgageContract.totalRepaid(), loanAmount + principalAmount, "Total repaid should include principal");
        assertTrue(mortgageContract.isLoanFullyRepaid() == false, "Loan should not be fully repaid yet");

        vm.stopPrank();
    }

    function test_DepositInterest_ValidAmount() public {
        // First, transition to ACTIVE stage
        vm.startPrank(operator);
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transferFrom.selector, operator, address(mortgageContract), loanAmount),
            abi.encode(true)
        );
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transfer.selector, borrower, loanAmount),
            abi.encode(true)
        );
        mortgageContract.withdrawLoan(loanAmount);

        // Mock investor shares for testing
        vm.store(
            address(mortgageContract),
            keccak256(abi.encode(investor1, uint256(1))), // shares mapping slot
            bytes32(uint256(60_000 * 10**6))
        );
        vm.store(
            address(mortgageContract),
            keccak256(abi.encode(investor2, uint256(1))), // shares mapping slot
            bytes32(uint256(40_000 * 10**6))
        );
        vm.store(
            address(mortgageContract),
            bytes32(uint256(2)), // totalShares slot
            bytes32(uint256(100_000 * 10**6))
        );

        uint256 interestAmount = 2_000 * 10**6; // 2,000 USDT

        // Expect InterestDeposited event
        vm.expectEmit(true, true, true, true, address(mortgageContract));
        emit MortgageContract.InterestDeposited(operator, interestAmount, interestAmount, (interestAmount * 1e6) / (100_000 * 10**6));

        // Deposit interest
        mortgageContract.depositInterest(interestAmount);

        // Verify state updates
        assertEq(mortgageContract.interestPaid(), interestAmount, "Interest paid should be updated");
        assertEq(mortgageContract.totalRepaid(), loanAmount + interestAmount, "Total repaid should include interest");

        vm.stopPrank();
    }

    function test_DepositPrincipal_InvalidStage() public {
        vm.startPrank(operator);

        uint256 amount = 1_000 * 10**6;

        // Test in FUNDED stage
        vm.expectRevert("Invalid stage for principal deposit");
        mortgageContract.depositPrincipal(amount);

        vm.stopPrank();
    }

    function test_DepositInterest_InvalidStage() public {
        vm.startPrank(operator);

        uint256 amount = 1_000 * 10**6;

        // Test in FUNDED stage
        vm.expectRevert("Invalid stage for interest deposit");
        mortgageContract.depositInterest(amount);

        vm.stopPrank();
    }

    function test_DepositZeroAmount() public {
        vm.startPrank(operator);

        // Test zero principal deposit
        vm.expectRevert("Amount must be greater than zero");
        mortgageContract.depositPrincipal(0);

        // Test zero interest deposit
        vm.expectRevert("Amount must be greater than zero");
        mortgageContract.depositInterest(0);

        vm.stopPrank();
    }

    function test_FullLoanRepaymentScenario() public {
        // Complete loan lifecycle test
        vm.startPrank(operator);

        // 1. Transition to ACTIVE stage
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transferFrom.selector, operator, address(mortgageContract), loanAmount),
            abi.encode(true)
        );
        vm.mockCall(
            usdtToken,
            abi.encodeWithSelector(IERC20(usdtToken).transfer.selector, borrower, loanAmount),
            abi.encode(true)
        );
        mortgageContract.withdrawLoan(loanAmount);

        // Mock investor shares
        vm.store(
            address(mortgageContract),
            keccak256(abi.encode(investor1, uint256(1))), // shares mapping slot
            bytes32(uint256(60_000 * 10**6))
        );
        vm.store(
            address(mortgageContract),
            keccak256(abi.encode(investor2, uint256(1))), // shares mapping slot
            bytes32(uint256(40_000 * 10**6))
        );
        vm.store(
            address(mortgageContract),
            bytes32(uint256(2)), // totalShares slot
            bytes32(uint256(100_000 * 10**6))
        );

        // 2. Make full principal repayment
        uint256 remainingPrincipal = loanAmount;
        mortgageContract.depositPrincipal(remainingPrincipal);

        // Verify stage transition to REPAID
        assertEq(mortgageContract.stage(), uint8(MortgageContract.Stage.REPAID), "Contract should be in REPAID stage");
        assertTrue(mortgageContract.isLoanFullyRepaid(), "Loan should be fully repaid");
        assertEq(mortgageContract.getRemainingPrincipal(), 0, "No remaining principal");

        vm.stopPrank();
    }

    function test_HelperFunctions() public {
        // Test getAvailableForWithdrawal in FUNDED stage
        vm.startPrank(operator);
        uint256 available = mortgageContract.getAvailableForWithdrawal();
        assertEq(available, loanAmount, "Full amount should be available for withdrawal in FUNDED stage");

        // Test getRemainingPrincipal
        uint256 remaining = mortgageContract.getRemainingPrincipal();
        assertEq(remaining, loanAmount, "Full loan amount should be remaining initially");

        // Test isLoanFullyRepaid
        assertFalse(mortgageContract.isLoanFullyRepaid(), "Loan should not be fully repaid initially");

        vm.stopPrank();
    }

    function test_AccessControl() public {
        // Test non-operator cannot withdraw loan
        vm.startPrank(borrower);
        vm.expectRevert(); // Should revert due to access control
        mortgageContract.withdrawLoan(loanAmount);
        vm.stopPrank();

        // Test non-operator cannot deposit principal
        vm.startPrank(borrower);
        vm.expectRevert(); // Should revert due to access control
        mortgageContract.depositPrincipal(1000);
        vm.stopPrank();

        // Test non-operator cannot deposit interest
        vm.startPrank(borrower);
        vm.expectRevert(); // Should revert due to access control
        mortgageContract.depositInterest(1000);
        vm.stopPrank();
    }
}