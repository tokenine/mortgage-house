// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/MortgageContract.sol";

/**
 * DeployMortgageContract Script
 *
 * This script deploys new MortgageContract instances with specified parameters
 * and assigns the OPERATOR_ROLE to the deploying wallet (master wallet).
 *
 * Usage:
 * forge script script/DeployMortgageContract.s.sol --rpc-url <rpc-url> --broadcast
 *
 * Parameters can be configured via environment variables or command line:
 * - BORROWER_ADDRESS: The borrower wallet address
 * - LOAN_AMOUNT: Loan amount in USDT (6 decimals, e.g., 100000000000 = 100,000 USDT)
 * - USDT_TOKEN: USDT token contract address
 * - INTEREST_RATE: Annual interest rate in basis points (e.g., 750 = 7.50%)
 * - LOAN_TERM: Loan term in months (e.g., 360 for 30 years)
 * - PROPERTY_DESCRIPTION: Property description string
 */
contract DeployMortgageContract is Script {
    struct DeploymentParams {
        address borrower;
        uint256 loanAmount;
        address usdtToken;
        uint256 interestRate;
        uint256 loanTerm;
        string propertyDescription;
    }

    MortgageContract public deployedContract;
    DeploymentParams public params;

    // Constants for validation
    uint256 public constant MIN_LOAN_AMOUNT = 10_000 * 10**6; // 10,000 USDT minimum
    uint256 public constant MAX_LOAN_AMOUNT = 10_000_000 * 10**6; // 10M USDT maximum
    uint256 public constant MIN_INTEREST_RATE = 100; // 1% minimum
    uint256 public constant MAX_INTEREST_RATE = 2000; // 20% maximum
    uint256 public constant MIN_LOAN_TERM = 12; // 12 months minimum
    uint256 public constant MAX_LOAN_TERM = 360; // 360 months maximum (30 years)

    event MortgageDeployed(
        address indexed contractAddress,
        address indexed borrower,
        uint256 loanAmount,
        address indexed usdtToken,
        uint256 interestRate,
        uint256 loanTerm,
        string propertyDescription,
        address operator
    );

    function setUp() public {
        // Default parameters for testing
        params.borrower = address(0x1234567890123456789012345678901234567890);
        params.loanAmount = 100_000 * 10**6; // 100,000 USDT
        params.usdtToken = address(0xdAC17F958D2ee523a2206206994597C13D831ec7); // Mainnet USDT
        params.interestRate = 750; // 7.5% annual
        params.loanTerm = 360; // 30 years
        params.propertyDescription = "Modern 3-bedroom house in downtown area";
    }

    /**
     * @dev Deploy a new MortgageContract with specified parameters
     * @param borrower The borrower wallet address
     * @param loanAmount Loan amount in USDT (6 decimals)
     * @param usdtToken USDT token contract address
     * @param interestRate Annual interest rate in basis points (100 = 1%)
     * @param loanTerm Loan term in months
     * @param propertyDescription Description of the property
     */
    function deployMortgageContract(
        address borrower,
        uint256 loanAmount,
        address usdtToken,
        uint256 interestRate,
        uint256 loanTerm,
        string memory propertyDescription
    ) public returns (address) {
        // Validate deployment parameters
        _validateDeploymentParams(borrower, loanAmount, usdtToken, interestRate, loanTerm);

        vm.startBroadcast();

        // Deploy the MortgageContract with constructor parameters
        deployedContract = new MortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription,
            msg.sender // Deployer becomes operator
        );

        vm.stopBroadcast();

        // Update local params
        params.borrower = borrower;
        params.loanAmount = loanAmount;
        params.usdtToken = usdtToken;
        params.interestRate = interestRate;
        params.loanTerm = loanTerm;
        params.propertyDescription = propertyDescription;

        // Emit deployment event
        emit MortgageDeployed(
            address(deployedContract),
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription,
            msg.sender
        );

        return address(deployedContract);
    }

    /**
     * @dev Deploy with environment variables
     */
    function deployFromEnv() public returns (address) {
        address borrower = vm.envAddress("BORROWER_ADDRESS");
        uint256 loanAmount = vm.envUint("LOAN_AMOUNT");
        address usdtToken = vm.envAddress("USDT_TOKEN");
        uint256 interestRate = vm.envUint("INTEREST_RATE");
        uint256 loanTerm = vm.envUint("LOAN_TERM");
        string memory propertyDescription = vm.envString("PROPERTY_DESCRIPTION");

        return deployMortgageContract(
            borrower,
            loanAmount,
            usdtToken,
            interestRate,
            loanTerm,
            propertyDescription
        );
    }

    /**
     * @dev Main deployment function for Foundry
     */
    function run() public {
        // Try to use environment variables first, fall back to defaults
        try {
            deployFromEnv();
        } catch {
            deployMortgageContract(
                params.borrower,
                params.loanAmount,
                params.usdtToken,
                params.interestRate,
                params.loanTerm,
                params.propertyDescription
            );
        }

        console.log("MortgageContract deployed at:", address(deployedContract));
        console.log("Borrower:", deployedContract.borrower());
        console.log("Loan Amount:", deployedContract.loanAmount());
        console.log("Interest Rate:", deployedContract.interestRate());
        console.log("Loan Term:", deployedContract.loanTerm());
        console.log("USDT Token:", address(deployedContract.usdtToken()));
        console.log("Operator Role:", msg.sender);
    }

    /**
     * @dev Validate deployment parameters
     */
    function _validateDeploymentParams(
        address borrower,
        uint256 loanAmount,
        address usdtToken,
        uint256 interestRate,
        uint256 loanTerm
    ) internal pure {
        require(borrower != address(0), "Invalid borrower address");
        require(borrower != tx.origin, "Borrower cannot be the deployer");
        require(usdtToken != address(0), "Invalid USDT token address");

        require(loanAmount >= MIN_LOAN_AMOUNT, "Loan amount below minimum");
        require(loanAmount <= MAX_LOAN_AMOUNT, "Loan amount exceeds maximum");

        require(interestRate >= MIN_INTEREST_RATE, "Interest rate below minimum");
        require(interestRate <= MAX_INTEREST_RATE, "Interest rate exceeds maximum");

        require(loanTerm >= MIN_LOAN_TERM, "Loan term below minimum");
        require(loanTerm <= MAX_LOAN_TERM, "Loan term exceeds maximum");
    }

    /**
     * @dev Estimate gas cost for deployment
     */
    function estimateDeploymentGas() public returns (uint256) {
        vm.startBroadcast();

        deployedContract = new MortgageContract(
            params.borrower,
            params.loanAmount,
            params.usdtToken,
            params.interestRate,
            params.loanTerm,
            params.propertyDescription,
            msg.sender
        );

        vm.stopBroadcast();

        return gasleft();
    }

    /**
     * @dev Batch deploy multiple contracts
     */
    function batchDeploy(
        DeploymentParams[] memory deploymentParams
    ) public returns (address[] memory deployedAddresses) {
        deployedAddresses = new address[](deploymentParams.length);

        for (uint256 i = 0; i < deploymentParams.length; i++) {
            deployedAddresses[i] = deployMortgageContract(
                deploymentParams[i].borrower,
                deploymentParams[i].loanAmount,
                deploymentParams[i].usdtToken,
                deploymentParams[i].interestRate,
                deploymentParams[i].loanTerm,
                deploymentParams[i].propertyDescription
            );
        }

        return deployedAddresses;
    }

    /**
     * @dev Get deployment summary
     */
    function getDeploymentSummary() public view returns (
        address contractAddress,
        address borrower,
        uint256 loanAmount,
        address usdtToken,
        uint256 interestRate,
        uint256 loanTerm,
        string memory propertyDescription
    ) {
        return (
            address(deployedContract),
            deployedContract.borrower(),
            deployedContract.loanAmount(),
            address(deployedContract.usdtToken()),
            deployedContract.interestRate(),
            deployedContract.loanTerm(),
            deployedContract.propertyDescription()
        );
    }
}