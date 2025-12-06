// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MortgageContract.sol";
import "../script/DeployMortgageContract.s.sol";

contract DeployMortgageContractTest is Test {
    DeployMortgageContract public deployScript;
    MortgageContract public mortgageContract;

    // Test addresses
    address public operator = address(0x1);
    address public borrower = address(0x2);
    address public usdtToken = address(0x3);

    // Test parameters
    uint256 public loanAmount = 100_000 * 10**6; // 100,000 USDT
    uint256 public interestRate = 750; // 7.5% annual
    uint256 public loanTerm = 360; // 30 years
    string public propertyDescription = "Test Property - Modern 3-bedroom house";

    function setUp() public {
        deployScript = new DeployMortgageContract();

        // Fund operator with ETH for deployment
        vm.deal(operator, 10 ether);
    }

    function test_DeployMortgageContract_ValidParameters() public {
        vm.startPrank(operator);

        address deployedAddress = deployScript.deployMortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription
        );

        vm.stopPrank();

        // Verify contract was deployed
        assertTrue(deployedAddress != address(0), "Contract address should not be zero");

        mortgageContract = MortgageContract(deployedAddress);

        // Verify contract initialization
        assertEq(mortgageContract.borrower(), borrower, "Borrower should be set correctly");
        assertEq(mortgageContract.loanAmount(), loanAmount, "Loan amount should be set correctly");
        assertEq(address(mortgageContract.usdtToken()), usdtToken, "USDT token should be set correctly");
        assertEq(mortgageContract.interestRate(), interestRate, "Interest rate should be set correctly");
        assertEq(mortgageContract.loanTerm(), loanTerm, "Loan term should be set correctly");
        assertEq(mortgageContract.propertyDescription(), propertyDescription, "Property description should be set correctly");

        // Verify operator role assignment
        assertTrue(mortgageContract.hasRole(mortgageContract.OPERATOR_ROLE(), operator), "Operator should have OPERATOR_ROLE");

        // Verify initial stage
        assertEq(uint8(mortgageContract.stage()), 0, "Initial stage should be NOT_STARTED");
    }

    function test_DeployMortgageContract_InvalidBorrower() public {
        vm.startPrank(operator);

        vm.expectRevert("Invalid borrower address");
        deployScript.deployMortgageContract(
            address(0),
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription
        );

        vm.stopPrank();
    }

    function test_DeployMortgageContract_BorrowerCannotBeDeployer() public {
        vm.startPrank(operator);

        vm.expectRevert("Borrower cannot be deployer");
        deployScript.deployMortgageContract(
            operator,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription
        );

        vm.stopPrank();
    }

    function test_DeployMortgageContract_InvalidUsdtToken() public {
        vm.startPrank(operator);

        vm.expectRevert("Invalid USDT token address");
        deployScript.deployMortgageContract(
            borrower,
            loanAmount,
            address(0),
            interestRate,
            loanTerm,
            propertyDescription
        );

        vm.stopPrank();
    }

    function test_DeployMortgageContract_InvalidLoanAmount() public {
        vm.startPrank(operator);

        vm.expectRevert("Loan amount below minimum");
        deployScript.deployMortgageContract(
            borrower,
            1000, // Below minimum
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription
        );

        vm.stopPrank();
    }

    function test_DeployMortgageContract_InvalidInterestRate() public {
        vm.startPrank(operator);

        vm.expectRevert("Interest rate below minimum");
        deployScript.deployMortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            50, // Below 1% minimum
            loanTerm,
            propertyDescription
        );

        vm.stopPrank();
    }

    function test_DeployMortgageContract_InvalidLoanTerm() public {
        vm.startPrank(operator);

        vm.expectRevert("Loan term below minimum");
        deployScript.deployMortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            6, // Below 12 months minimum
            propertyDescription
        );

        vm.stopPrank();
    }

    function test_DeployMortgageContract_MortgageInitializedEvent() public {
        vm.startPrank(operator);

        vm.expectEmit(true, true, true, true, address(deployScript));
        emit DeployMortgageContract.MortgageDeployed(
            address(0), // Will be replaced with actual contract address
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription,
            operator
        );

        // We need to capture the actual deployed address
        // This is a simplified test - in production you'd capture the actual event
        address deployedAddress = deployScript.deployMortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription
        );

        vm.stopPrank();

        // Also test the contract's MortgageInitialized event
        vm.expectEmit(true, true, true, true, deployedAddress);
        emit MortgageInitialized(
            borrower,
            loanAmount,
            usdtToken,
            deployedAddress,
            propertyDescription
        );

        // Re-deploy to test the event
        vm.startPrank(operator);
        deployScript.deployMortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            "Another test property"
        );
        vm.stopPrank();
    }

    function test_StartFunding_Functionality() public {
        vm.startPrank(operator);

        address deployedAddress = deployScript.deployMortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription
        );

        mortgageContract = MortgageContract(deployedAddress);

        // Verify initial stage
        assertEq(uint8(mortgageContract.stage()), 0, "Initial stage should be NOT_STARTED");

        // Start funding
        mortgageContract.startFunding();

        // Verify stage changed to FUNDING
        assertEq(uint8(mortgageContract.stage()), 1, "Stage should be FUNDING");

        // Verify funding deadline was set (approximately 90 days from now)
        uint256 deadline = mortgageContract.fundingDeadline();
        uint256 expectedMinDeadline = block.timestamp + 90 days - 1 hours; // Allow 1 hour tolerance
        uint256 expectedMaxDeadline = block.timestamp + 90 days + 1 hours;
        assertTrue(deadline >= expectedMinDeadline && deadline <= expectedMaxDeadline, "Funding deadline should be ~90 days");

        vm.stopPrank();
    }

    function test_StartFunding_OnlyOperator() public {
        vm.startPrank(operator);

        address deployedAddress = deployScript.deployMortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription
        );

        vm.stopPrank();

        mortgageContract = MortgageContract(deployedAddress);

        // Try to start funding with non-operator
        vm.startPrank(borrower);

        vm.expectRevert(); // Should revert due to access control
        mortgageContract.startFunding();

        vm.stopPrank();
    }

    function test_StartFunding_CannotStartTwice() public {
        vm.startPrank(operator);

        address deployedAddress = deployScript.deployMortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription
        );

        mortgageContract = MortgageContract(deployedAddress);

        // Start funding
        mortgageContract.startFunding();

        // Try to start funding again
        vm.expectRevert("Contract already started");
        mortgageContract.startFunding();

        vm.stopPrank();
    }

    function test_GetDeploymentSummary() public {
        vm.startPrank(operator);

        address deployedAddress = deployScript.deployMortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription
        );

        vm.stopPrank();

        (
            address contractAddress,
            address returnedBorrower,
            uint256 returnedLoanAmount,
            address returnedUsdtToken,
            uint256 returnedInterestRate,
            uint256 returnedLoanTerm,
            string memory returnedPropertyDescription
        ) = deployScript.getDeploymentSummary();

        assertEq(contractAddress, deployedAddress, "Contract address should match");
        assertEq(returnedBorrower, borrower, "Borrower should match");
        assertEq(returnedLoanAmount, loanAmount, "Loan amount should match");
        assertEq(returnedUsdtToken, usdtToken, "USDT token should match");
        assertEq(returnedInterestRate, interestRate, "Interest rate should match");
        assertEq(returnedLoanTerm, loanTerm, "Loan term should match");
        assertEq(returnedPropertyDescription, propertyDescription, "Property description should match");
    }

    function test_BatchDeploy_Functionality() public {
        vm.startPrank(operator);

        DeployMortgageContract.DeploymentParams[] memory params = new DeployMortgageContract.DeploymentParams[](2);

        params[0] = DeployMortgageContract.DeploymentParams({
            borrower: address(0x10),
            loanAmount: 50_000 * 10**6,
            usdtToken: usdtToken,
            interestRate: 600,
            loanTerm: 180,
            propertyDescription: "First batch property"
        });

        params[1] = DeployMortgageContract.DeploymentParams({
            borrower: address(0x20),
            loanAmount: 75_000 * 10**6,
            usdtToken: usdtToken,
            interestRate: 800,
            loanTerm: 240,
            propertyDescription: "Second batch property"
        });

        address[] memory deployedAddresses = deployScript.batchDeploy(params);

        assertEq(deployedAddresses.length, 2, "Should deploy 2 contracts");
        assertTrue(deployedAddresses[0] != address(0), "First contract should be deployed");
        assertTrue(deployedAddresses[1] != address(0), "Second contract should be deployed");
        assertTrue(deployedAddresses[0] != deployedAddresses[1], "Contracts should have different addresses");

        // Verify first contract
        MortgageContract firstContract = MortgageContract(deployedAddresses[0]);
        assertEq(firstContract.borrower(), params[0].borrower, "First contract borrower should match");
        assertEq(firstContract.loanAmount(), params[0].loanAmount, "First contract loan amount should match");

        // Verify second contract
        MortgageContract secondContract = MortgageContract(deployedAddresses[1]);
        assertEq(secondContract.borrower(), params[1].borrower, "Second contract borrower should match");
        assertEq(secondContract.loanAmount(), params[1].loanAmount, "Second contract loan amount should match");

        vm.stopPrank();
    }

    function test_EstimateDeploymentGas() public {
        vm.startPrank(operator);

        uint256 gasBefore = gasleft();
        uint256 estimatedGas = deployScript.estimateDeploymentGas();
        uint256 gasAfter = gasleft();
        uint256 actualGasUsed = gasBefore - gasAfter;

        // Estimate should be reasonable (not exact, but close)
        assertTrue(estimatedGas > 0, "Gas estimate should be positive");
        assertTrue(estimatedGas > actualGasUsed * 80 / 100, "Estimate should be close to actual usage");
        assertTrue(estimatedGas < actualGasUsed * 120 / 100, "Estimate should not be too high");

        vm.stopPrank();
    }
}