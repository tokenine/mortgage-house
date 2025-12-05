# mortage-house - Epic Breakdown

**Author:** Poom-work
**Date:** 2025-12-05
**Project Level:** MVP
**Target Scale:** Single Property Mortgage Platform

---

## Overview

This document provides the complete epic and story breakdown for mortage-house, decomposing the requirements from the product brief into implementable stories with full technical and UX context.

**Living Document Notice:** This version incorporates complete PRD, Architecture, and UX Design context for comprehensive implementation guidance.

**Epics Summary:**
- Epic 1: Platform Foundation & Smart Contract Infrastructure
- Epic 2: User Authentication & Wallet Integration
- Epic 3: Mortgage Contract Investment Flow
- Epic 4: Investor Portfolio & Withdrawal Management
- Epic 5: Master Wallet Operator Controls
- Epic 6: Real-time Dashboard & Monitoring

---

## Functional Requirements Inventory

### Critical Priority Requirements (From PRD)
- **FR1: Smart Contract Infrastructure** - Deploy dedicated smart contracts for each mortgage property with complete lifecycle management, role-based access control, contract stage management, and comprehensive event emission
- **FR2: Fractional Investment System** - Enable fractional investment starting from 1 USDT with share-based ownership, real-time share issuance, ownership percentage calculations, and investment history tracking
- **FR3: Automated Distribution System** - Automatically calculate and distribute principal and interest payments pro-rata with individual investor entitlement tracking and withdrawal processing

### High Priority Requirements (From PRD)
- **FR4: User Wallet Integration** - Enable seamless wallet connection and transaction management with MetaMask and popular wallet provider support, USDT token approval and transfer flows, and transaction confirmation tracking
- **FR5: Investor Portfolio Management** - Provide comprehensive portfolio visibility and management capabilities with portfolio dashboard, real-time contract state synchronization, investment performance tracking, and export capabilities for tax reporting
- **FR6: Operator Management Interface** - Provide comprehensive controls for mortgage contract management with contract deployment interface, loan withdrawal and repayment processing, contract stage management, and operational metrics monitoring

### Medium Priority Requirements (From PRD)
- **FR7: Secondary Marketplace** - Enable share trading between investors for liquidity with sell order creation, order matching and execution, share transfer and ownership updates, and trading fee calculation
- **FR8: Real-time Monitoring and Alerts** - Provide real-time visibility into system activities with real-time contract state updates, event-based notification system, funding progress tracking, and system health monitoring

### Non-Functional Requirements (From PRD)
- **NFR1: Security** - Smart contract security with OpenZeppelin libraries, role-based access control, reentrancy protection, and regular security audits
- **NFR2: Performance** - Gas optimization targeting <0.01 ETH per operation, frontend page load times <3 seconds, real-time updates with <1 second latency
- **NFR3: Reliability** - 99.9% uptime availability, automated error recovery, data backup and disaster recovery procedures
- **NFR4: Scalability** - Architecture supports multiple contract deployments, database schema optimized for growing datasets, API design supports increasing request volumes
- **NFR5: Usability** - Zero blockchain knowledge required for basic operations, clear error messages with actionable guidance, mobile-responsive design
- **NFR6: Compliance** - KYC/AML integration for investor verification, tax reporting and documentation generation, complete audit trail maintenance

---

## FR Coverage Map

| FR ID | Priority | Epic | Description |
|------|----------|------|-------------|
| FR1 | Critical | Epic 1 | Smart Contract Infrastructure - Deploy dedicated contracts with lifecycle management |
| FR2 | Critical | Epic 3 | Fractional Investment System - Enable 1 USDT investment with share ownership |
| FR3 | Critical | Epic 4 | Automated Distribution System - Pro-rata principal/interest distributions |
| FR4 | High | Epic 2 | User Wallet Integration - MetaMask and wallet provider support |
| FR5 | High | Epic 4 | Investor Portfolio Management - Portfolio dashboard and performance tracking |
| FR6 | High | Epic 5 | Operator Management Interface - Contract deployment and management controls |
| FR7 | Medium | *Not in MVP* | Secondary Marketplace - Share trading between investors |
| FR8 | Medium | Epic 6 | Real-time Monitoring and Alerts - Contract state updates and notifications |
| NFR1 | Critical | Epic 1 | Security - OpenZeppelin libraries and access control |
| NFR2 | High | Epic 3 | Performance - Gas optimization <0.01 ETH per operation |
| NFR3 | High | Epic 6 | Reliability - 99.9% uptime and error recovery |
| NFR4 | Medium | Epic 1 | Scalability - Multi-contract support architecture |
| NFR5 | High | Epic 2 | Usability - Zero blockchain knowledge required |
| NFR6 | Critical | Epic 6 | Compliance - KYC/AML and audit trail |

---

## Epic 1: Platform Foundation & Smart Contract Infrastructure

**Epic Goal:** Establish the core technical foundation enabling secure, efficient mortgage smart contract operations with comprehensive access control and monitoring capabilities.

### Story 1.1: Initialize Foundry Project with OpenZeppelin Integration

As a developer,
I want to set up a Foundry smart contract project with OpenZeppelin libraries,
So that I can build secure mortgage contracts with standard access control and security patterns.

**Acceptance Criteria:**

Given I am setting up the mortage-house smart contract project
When I run the Foundry initialization commands
Then a new Foundry project is created at `/contracts` directory
And OpenZeppelin contracts are installed in `lib/openzeppelin-contracts`
And Foundry.toml is configured with solidity version 0.8.19+ and optimizer settings
And the project structure follows the established conventions: `/src`, `/test`, `/script`

Given I have the project structure
When I run `forge build`
Then the project compiles successfully with zero errors
And the gas usage optimizer is enabled with 200 runs
And the compilation output shows successful contract interface generation

**Technical Notes:**
- Follow Architecture section: "Foundry for smart contracts (fast, modern, test-first)"
- Use OpenZeppelin v5 for AccessControl, ReentrancyGuard, and Pausable contracts
- Configure optimizer for gas optimization targeting <0.01 ETH per operation
- Create initial `MortgageContract.sol` stub with proper SPDX and pragma statements

**Prerequisites:** None

---

### Story 1.2: Implement MortgageContract Core Structure with AccessControl

As a system architect,
I want to create the foundational MortgageContract with role-based access control,
So that the platform can enforce proper authorization patterns for different user types.

**Acceptance Criteria:**

Given I am working in the `/contracts/src` directory
When I create `MortgageContract.sol`
Then the contract imports and inherits from OpenZeppelin AccessControl, ReentrancyGuard, and Pausable
And defines three roles: DEFAULT_ADMIN_ROLE, OPERATOR_ROLE, INVESTOR_ROLE
And implements constructor that sets deployer as DEFAULT_ADMIN_ROLE
And includes modifier-onlyOperator for master wallet operations
And includes modifier-nonReentrant on all external functions

Given the contract is compiled
When I examine the deployed contract
Then role-based permissions are properly enforced
And only admin can grant/revoke OPERATOR_ROLE
And only operator can call master wallet functions
And public functions are accessible to INVESTOR_ROLE

**Technical Notes:**
- Follow Architecture "Access Control Pattern" section exactly
- Use bytes32 for role definitions as per OpenZeppelin standards
- Implement public functions `invest()` and `withdraw()` with INVESTOR_ROLE requirement
- Implement operator functions `withdrawLoan()`, `depositPrincipal()`, `depositInterest()` with onlyOperator modifier
- Follow AI-Agent Conflict Prevention naming patterns for events

**Prerequisites:** Story 1.1 - Foundry Project Setup Complete

---

### Story 1.3: Implement Event System for Complete Audit Trail

As a compliance officer,
I want every contract operation to emit detailed events,
So that all transactions are auditable and transparent on-chain.

**Acceptance Criteria:**

Given I have the MortgageContract structure
When I implement the event system
Then all events follow the "Simple Past Tense" naming convention from Architecture
And the contract emits `MortgageInitialized(address borrower, uint256 loanAmount, address asset)` on deployment
And the contract emits `Invested(address investor, uint256 amount, uint256 shares)` on investment
And the contract emits `LoanWithdrawn(address borrower, uint256 amount)` on loan withdrawal
And the contract emits `PrincipalDeposited(address from, uint256 amount)` on principal repayment
And the contract emits `InterestDeposited(address from, uint256 amount)` on interest repayment
And the contract emits `PayoutWithdrawn(address investor, uint256 principalAmount, uint256 interestAmount)` on investor withdrawal
And the contract emits `StageChanged(uint8 oldStage, uint8 newStage, address actor)` on stage transitions

Given events are implemented
When I test contract operations
Then every state change generates corresponding events with indexed parameters for efficient querying
And event logs provide complete audit trail for compliance requirements
And all events include gas-optimized parameter ordering (address, uint256, uint8 for stages)

**Technical Notes:**
- Follow AI-Agent Conflict Prevention "Required Event Names" exactly
- Use indexed parameters for addresses and amounts to enable efficient filtering
- Include all relevant data in events for complete audit trail (FR26)
- Ensure events are emitted before state changes for proper chronological order

**Prerequisites:** Story 1.2 - Core Contract Structure with AccessControl

---

### Story 1.4: Create Foundry Test Suite with Lifecycle Simulation

As a developer,
I want comprehensive Foundry tests covering the complete mortgage lifecycle,
So that I can verify contract functionality and security before deployment.

**Acceptance Criteria:**

Given I have a working MortgageContract
When I create the test suite in `/contracts/test/Mortgage.t.sol`
Then tests cover the complete investment lifecycle: deployment → funding → loan withdrawal → repayments → investor payouts
And tests include edge cases: zero investments, single investor, multiple investors, partial repayments
And tests verify gas usage stays under 0.01 ETH for typical operations
And tests validate access control restrictions for each role
And tests include failure scenarios: insufficient funds, unauthorized access, invalid stages

Given I run `forge test`
Then all tests pass with 95%+ code coverage
And gas optimization tests confirm <0.01 ETH per operation target
And security tests verify reentrancy protection and access control
And lifecycle simulation completes without manual intervention

**Technical Notes:**
- Follow Architecture "Testing Strategy" section with Foundry testing patterns
- Use `forge script` for deployment simulation and lifecycle testing
- Include specific tests for mathematical accuracy of pro-rata distributions
- Test event emission completeness for audit trail requirements
- Use Foundry's VM for time manipulation testing repayment schedules

**Prerequisites:** Story 1.3 - Event System Implementation Complete

---

## Epic 2: User Authentication & Wallet Integration

**Epic Goal:** Enable seamless wallet connectivity with robust error handling and real-time state management for investor and operator interactions.

### Story 2.1: Initialize Nuxt 3 Project with Web3 Modal Integration

As a frontend developer,
I want to set up a Nuxt 3 project with Nuxt Web3 Modal and Viem integration,
So that users can connect their crypto wallets securely and efficiently.

**Acceptance Criteria:**

Given I am setting up the mortage-house frontend
When I create the Nuxt 3 project
Then the project is initialized at `/frontend` directory
And Nuxt UI and Nuxt Web3 Modal are installed and configured
And Viem is installed for type-safe blockchain interactions
And TypeScript configuration includes proper types for Web3 operations
And the project follows the established file structure: `/composables`, `/utils`, `/pages`

Given the project is configured
When I run the development server
Then the Nuxt application starts successfully on localhost:3000
And the Web3 Modal is properly initialized and ready for wallet connections
And TypeScript compilation succeeds without errors for Web3 integrations

**Technical Notes:**
- Follow Architecture "Frontend Architecture" section for Nuxt 3 + Viem setup
- Use Nuxt Web3 Modal for wallet connections (MetaMask, WalletConnect, etc.)
- Configure TypeScript strict mode for type safety with blockchain interactions
- Enable auto-imports for Nuxt UI components and Web3 composables

**Prerequisites:** Epic 1 - Smart Contract Infrastructure Complete

---

### Story 2.2: Implement useMortgageContract Composable with Complete API

As a frontend developer,
I want to create a centralized composable for all contract interactions,
So that the frontend can consistently interact with mortgage smart contracts across all components.

**Acceptance Criteria:**

Given I have the Nuxt project structure
When I create `composables/useMortgageContract.ts`
Then it implements the exact API shape defined in Architecture "Entity-Based Composable"
And it provides reactive state for `contract`, `stage`, `stats`, and `investorPosition`
And it implements all contract functions: `invest()`, `withdrawPayout()`, `withdrawLoan()`, `depositPrincipal()`, `depositInterest()`, `transferShares()`
And it includes marketplace functions: `createSellOrder()`, `cancelSellOrder()`, `buySellOrder()`
And it exposes `lastError` following the structured MortgageError type from Architecture
And it handles real-time event listening for contract state updates

Given I use the composable in a component
When I call contract functions
Then all blockchain interactions go through the composable without direct contract calls
And errors are properly typed and exposed through `lastError` reactive state
And loading states are managed automatically during transactions
And gas estimates are provided before transaction execution

**Technical Notes:**
- Follow AI-Agent Conflict Prevention "Entity-Based Composable" pattern exactly
- Use Viem for type-safe contract interactions with auto-generated ABIs
- Implement proper error handling with structured MortgageError type
- Use reactive state management for real-time contract synchronization
- Include event listeners for automatic state updates on contract changes

**Prerequisites:** Story 2.1 - Nuxt Project with Web3 Modal Setup

---

### Story 2.3: Create Structured Error Handling System

As a user experience designer,
I want consistent, helpful error messages for all blockchain operations,
So that users understand what went wrong and how to resolve issues.

**Acceptance Criteria:**

Given I have the MortgageError type defined in Architecture
When I implement error handling in the useMortgageContract composable
Then all errors follow the structured format: `{scope: 'CONTRACT'|'FRONTEND'|'NETWORK', type: string, code?: string, message: string}`
And contract errors are translated from technical messages to user-friendly explanations
And network errors include retry suggestions and connection status
And frontend validation errors provide specific guidance for correction
And all errors are logged for debugging while showing simplified messages to users

Given a user encounters an error
When the error is displayed
Then the message is clear, actionable, and non-technical
And appropriate recovery actions are suggested
And error state is visually distinct from success states
And support contact information is available for unresolved issues

**Technical Notes:**
- Follow Architecture "Error Message Format" section exactly
- Create error mapping from contract revert reasons to user-friendly messages
- Implement error boundary components for graceful error handling
- Use consistent error visual patterns from MUI design system
- Include error analytics tracking for support team visibility

**Prerequisites:** Story 2.2 - useMortgageContract Composable Implementation

---

## Epic 3: Mortgage Contract Investment Flow

**Epic Goal:** Enable seamless fractional investment in mortgage contracts with real-time transparency and instant confirmation for investors.

### Story 3.1: Implement Investment Function with Share Issuance

As an investor (Savvy Sarah),
I want to invest USDT in mortgage contracts and receive shares instantly,
So that I can participate in fractional mortgage funding starting from 1 USDT.

**Acceptance Criteria:**

Given I am connected to the mortage-house platform with my wallet
When I view an available mortgage contract
Then I can see the funding progress, total funded amount, and my potential ownership percentage
And I can input an investment amount in USDT with real-time share calculation (1 USDT = 1 share)
And I see a clear "Invest" button with gas estimate and transaction preview

Given I enter an investment amount and confirm
When the transaction is processed
Then the smart contract `invest()` function is called with the specified USDT amount
And shares are issued to my wallet address immediately (1 share per USDT)
And the contract emits `Invested` event with my address, amount, and issued shares
And my ownership percentage and withdrawable amounts are updated in real-time
And I see a success confirmation with transaction link to block explorer

Given the investment completes successfully
When I view the contract
Then the total funded amount increases by my investment amount
And my personal shares and ownership position are displayed accurately
And the funding progress bar reflects the new investment
And all contract metrics update without page refresh

**Technical Notes:**
- Implement `invest(uint256 amount)` function in MortgageContract with USDT token transfer and share issuance
- Use openzeppelin SafeERC20 for secure USDT transfers
- Validate investment amounts against minimum (1 USDT) and maximum (remaining funding needed)
- Update `shares[investor]` and `totalFunded` state variables atomically
- Follow AI-Agent naming for `Invested` event with indexed parameters

**Prerequisites:** Epic 2 - User Authentication & Wallet Integration Complete

---

### Story 3.2: Create Real-time Funding Progress Visualization

As an investor,
I want to see real-time funding progress and participate in active investment opportunities,
So that I can make informed decisions about mortgage contract participation.

**Acceptance Criteria:**

Given I am viewing an available mortgage contract
When the contract is in FUNDING stage
Then I see a prominent progress bar showing current funding vs target amount
And I see real-time updates when other investors make investments
And I can view the list of recent investment transactions with timestamps
And I can see my position relative to other investors (ownership percentage, total shares)

Given the contract reaches full funding
When I am viewing the contract
Then the funding progress shows 100% completion
And the contract automatically transitions to ACTIVE stage
And I receive notification that funding is complete and loan is being withdrawn
And all investors see their positions locked for the active mortgage period

Given multiple investors are funding simultaneously
When I am on the investment page
Then the funding progress updates in real-time without page refresh
And new investments appear immediately in the transaction feed
And gas estimates update based on current network conditions
And the UI remains responsive during high activity periods

**Technical Notes:**
- Use WebSocket connections or polling for real-time contract state updates
- Implement event listeners for `Invested` events to update UI automatically
- Create funding progress component with percentage calculation and visual indicators
- Use MUI progress components with custom theming for mortgage branding
- Implement optimistic updates for immediate feedback with transaction confirmation

**Prerequisites:** Story 3.1 - Investment Function Implementation

---

### Story 3.3: Implement Gas Optimization for Investment Operations

As an investor,
I want investment transactions to cost minimal gas fees,
So that small investments remain economically viable and accessible.

**Acceptance Criteria:**

Given I am making an investment in a mortgage contract
When I prepare the transaction
Then the gas estimate is displayed before transaction confirmation
And the gas cost is shown in both ETH and USD equivalent
And the transaction cost is less than 0.01 ETH for typical investment amounts
And any gas optimization opportunities are explained to the user

Given the network is congested
When I attempt to invest
Then I am notified of higher gas costs and can choose to wait or proceed
And alternative transaction speeds are presented with cost trade-offs
And the platform suggests optimal timing for gas cost savings
And historical gas cost data is shown for transparency

Given the transaction is confirmed
When I view the transaction details
Then the actual gas used is displayed and compared to the estimate
And any gas savings from optimizations are highlighted
And the total cost (investment amount + gas) is clearly shown

**Technical Notes:**
- Optimize smart contract storage operations to minimize gas usage
- Use packed structs and efficient data types for state variables
- Implement gas estimation in the composable before transaction execution
- Use EIP-1559 transaction parameters for dynamic gas pricing
- Batch operations where possible to reduce transaction count

**Prerequisites:** Story 3.1 - Investment Function Implementation

---

## Epic 4: Investor Portfolio & Withdrawal Management

**Epic Goal:** Provide investors with comprehensive portfolio visibility, automated earnings tracking, and instant withdrawal capabilities for their mortgage investments.

### Story 4.1: Implement Pro-rata Distribution Calculations

As an investor,
I want to automatically receive my fair share of principal and interest repayments,
So that I can trust the platform to calculate and distribute earnings accurately.

**Acceptance Criteria:**

Given I own shares in an active mortgage contract
When the borrower makes a principal repayment
Then the smart contract calculates my pro-rata share automatically
And my entitled principal amount updates immediately: `(myShares / totalShares) * principalRepaid`
And the contract emits `PrincipalDeposited` event with total amount and distribution details
And I can withdraw my entitled principal amount instantly

Given the borrower makes an interest payment
When the interest is deposited in the contract
Then my entitled interest amount is calculated: `(myShares / totalShares) * interestAmount`
And my withdrawable interest balance updates in real-time
And the contract emits `InterestDeposited` event with allocation details
And I receive notification about available interest earnings

Given there are multiple partial repayments over time
When I view my investment position
Then my total entitled amounts accumulate correctly across all repayments
And I can see detailed history of all repayment events and my allocations
And the platform prevents double-withdrawal of already withdrawn amounts
And all calculations are mathematically verifiable on-chain

**Technical Notes:**
- Implement precise pro-rata calculations using fixed-point arithmetic to prevent rounding errors
- Track `principalRepaid` and `interestPaid` as separate cumulative counters
- Maintain `withdrawnPrincipal[user]` and `withdrawnInterest[user]` to prevent double withdrawals
- Use SafeMath or Solidity 0.8+ built-in overflow protection for all calculations
- Emit detailed events with both total amounts and per-share calculations

**Prerequisites:** Epic 3 - Investment Flow Complete

---

### Story 4.2: Create Investor Portfolio Dashboard

As an investor (Savvy Sarah),
I want to view all my mortgage investments in one comprehensive dashboard,
So that I can track my portfolio performance and make informed investment decisions.

**Acceptance Criteria:**

Given I am logged into mortage-house with my wallet
When I navigate to my portfolio
Then I see all my mortgage investments listed with key metrics: property, shares owned, current value, earnings
And I can view individual contract details including funding progress, repayment status, and withdrawable amounts
And I see portfolio-level statistics: total invested, total earnings, portfolio value, average return
And I can access historical transactions and earnings history across all investments

Given I select a specific investment
When I view the investment details
Then I see real-time contract state synchronized with the blockchain
And I can view my exact ownership position and percentage
And I see breakdown of withdrawable principal vs interest amounts
And I can initiate withdrawals directly from the portfolio view

Given there are multiple contracts in different stages
When I view my portfolio
Then contracts are organized by stage: FUNDING, ACTIVE, CLOSED
And I can filter and sort investments by various criteria
And I see notifications for important events (new contracts available, repayments received)
And I can easily identify which contracts have withdrawable earnings

**Technical Notes:**
- Implement portfolio state management using Pinia for global application state
- Use reactive contract state through Viem subscriptions for real-time updates
- Create reusable portfolio components using MUI cards and data tables
- Implement data visualization with MUI charts for portfolio performance
- Use the useMortgageContract composable for all contract interactions

**Prerequisites:** Story 4.1 - Pro-rata Distribution Calculations

---

### Story 4.3: Implement Instant Withdrawal Processing

As an investor,
I want to withdraw my entitled earnings instantly with one click,
So that I can access my money immediately without delays or manual processes.

**Acceptance Criteria:**

Given I have withdrawable amounts in my mortgage investments
When I view my portfolio or individual investment
Then I see clear "Withdraw" buttons with amounts for principal and interest separately
And I can choose to withdraw principal only, interest only, or both
And I see the transaction details and gas cost before confirmation
And I receive a one-click withdrawal experience with minimal confirmation steps

Given I confirm a withdrawal
When the transaction is processed
Then the smart contract calculates my exact withdrawable amounts
And the `withdraw()` function transfers entitled amounts to my wallet immediately
And the contract emits `PayoutWithdrawn` event with principal and interest amounts
And my withdrawable balances are updated to reflect the withdrawal
And I receive instant confirmation with transaction link

Given I have multiple investments with withdrawable amounts
When I want to withdraw from multiple contracts
Then I can process withdrawals individually or in batch where supported
And each withdrawal is processed atomically to prevent race conditions
And I can see the status of each withdrawal in real-time
And my portfolio updates immediately to reflect new balances

**Technical Notes:**
- Implement `withdraw()` function in MortgageContract with separate principal/interest calculations
- Validate withdrawable amounts against user's entitled but not withdrawn amounts
- Use ReentrancyGuard modifier on withdrawal functions to prevent attack vectors
- Emit comprehensive `PayoutWithdrawn` events for audit trail
- Implement withdrawal history tracking for user reference

**Prerequisites:** Story 4.2 - Investor Portfolio Dashboard

---

### Story 4.4: Create Historical Transaction Tracking

As an investor,
I want to see complete transaction history for all my investments,
So that I can track my investment performance and verify all activities.

**Acceptance Criteria:**

Given I am viewing my investment portfolio
When I access the transaction history
Then I see a chronological list of all my investment-related transactions
And each transaction shows: date/time, type (invest/withdraw/repayment), amounts, contract reference, and block explorer link
And I can filter transactions by type, date range, or specific contract
And I can export transaction history for tax reporting purposes

Given I want detailed information about a specific transaction
When I click on a transaction
Then I see complete details including contract state before/after, gas cost, and verification links
And I can directly access the transaction on Etherscan/Optimism Explorer
And I can see related events and their impact on my investment position
And I have access to all blockchain data for independent verification

Given there are multiple contracts and transactions
When I analyze my investment performance
Then I can see year-to-date earnings, total returns, and investment performance metrics
And I can compare performance across different contracts and time periods
And I have access to comprehensive data for financial planning and tax preparation
And all data is mathematically verifiable against on-chain transactions

**Technical Notes:**
- Use event indexing to efficiently retrieve transaction history from smart contracts
- Implement pagination for large transaction histories to maintain performance
- Create filtering and sorting capabilities using MUI data tables
- Generate tax documents using transaction categorization and cost basis calculations
- Ensure all transaction data can be independently verified on-chain

**Prerequisites:** Story 4.3 - Instant Withdrawal Processing

---

## Epic 5: Master Wallet Operator Controls

**Epic Goal:** Provide comprehensive operational controls for master wallet operators to manage mortgage contracts, process repayments, and oversee the complete investment lifecycle.

### Story 5.1: Create Mortgage Contract Deployment Interface

As a system manager (Operations Omar),
I want to deploy new mortgage contracts through an intuitive interface,
So that I can efficiently onboard new properties and manage the investment pipeline.

**Acceptance Criteria:**

Given I am logged in as a master wallet operator
When I access the operator dashboard
Then I see a "Deploy New Mortgage" button with clear configuration options
And I can input property details: loan amount, USDT token address, and contract parameters
And I see real-time validation of deployment parameters and estimated gas costs
And I can review all configuration details before deployment confirmation

Given I confirm contract deployment
When the deployment process executes
Then a new MortgageContract is deployed with the specified parameters
And the contract is initialized with my master wallet as the OPERATOR_ROLE holder
And the contract emits `MortgageInitialized` event with all deployment details
And the contract appears in my operator dashboard with ACTIVE status
And I can immediately begin accepting investor funding

Given deployment is successful
When I view the new contract
Then I can see the contract address, deployment transaction, and verification links
And I have full operator controls for loan withdrawal and repayment processing
And the contract is properly linked to the property documentation and underwriting records
And I can monitor funding progress and investor participation in real-time

**Technical Notes:**
- Implement deployment script using Foundry forge script with configurable parameters
- Create deployment interface using MUI forms with validation and error handling
- Use factory pattern for contract deployment if multiple contracts are needed
- Implement role assignment automatically during deployment (master wallet = OPERATOR_ROLE)
- Store deployment metadata for audit trail and contract management

**Prerequisites:** Epic 1 - Smart Contract Infrastructure Complete

---

### Story 5.2: Implement Loan Withdrawal and Repayment Processing

As a master wallet operator,
I want to withdraw funded loan amounts and process borrower repayments,
So that I can manage the complete mortgage lifecycle and ensure investor distributions.

**Acceptance Criteria:**

Given a mortgage contract has completed funding
When I access the operator controls for that contract
Then I see "Withdraw Loan" option with the total funded amount available
And I can initiate loan withdrawal to the borrower's wallet address
And I see real-time status updates during the withdrawal process
And the contract emits `LoanWithdrawn` event with withdrawal details

Given the borrower makes a principal repayment
When I process the repayment in the operator dashboard
Then I can input the principal repayment amount with validation
And the `depositPrincipal()` function updates the contract state and calculates pro-rata distributions
And all investors' entitled principal amounts are updated automatically
And the contract emits `PrincipalDeposited` event with total amount and per-investor allocations

Given the borrower makes an interest payment
When I process the interest payment
Then I can input the interest amount with proper validation
And the `depositInterest()` function updates contract state and calculates investor entitlements
And all investors' withdrawable interest amounts are updated immediately
And the contract emits `InterestDeposited` event with distribution breakdown
And I can see the updated repayment schedule and remaining obligations

**Technical Notes:**
- Implement `withdrawLoan(uint256 amount)` function with OPERATOR_ROLE restriction
- Create `depositPrincipal(uint256 amount)` and `depositInterest(uint256 amount)` functions
- Use precise arithmetic for pro-rata distribution calculations
- Validate repayment amounts against loan terms and available balances
- Implement comprehensive event logging for all repayment processing

**Prerequisites:** Story 5.1 - Contract Deployment Interface

---

### Story 5.3: Create Contract Stage Management System

As a master wallet operator,
I want to manage contract stage transitions (Funding → Active → Closed),
So that I can control the mortgage lifecycle and ensure proper state management.

**Acceptance Criteria:**

Given I am managing a mortgage contract
When I access the stage management controls
Then I can see the current contract stage: FUNDING, ACTIVE, or CLOSED
And I understand what operations are available in each stage
And I can initiate stage transitions with proper validation and confirmations
And I see a clear timeline of stage changes with reasons and timestamps

Given funding is complete and I want to activate the contract
When I initiate the transition to ACTIVE stage
Then the contract validates that full funding has been achieved
And the `setStage(ACTIVE)` function is called with OPERATOR_ROLE validation
And the contract emits `StageChanged` event with old and new stages
And investor operations transition from funding to monitoring mode
And loan withdrawal becomes available for the borrower

Given the mortgage is fully repaid or closed
When I transition to CLOSED stage
Then the contract validates that all investor distributions are complete
And the contract prevents further investments or operations
And final accounting and audit trails are generated automatically
And all stakeholders are notified of the contract completion

**Technical Notes:**
- Implement enum-based stage system with clear state definitions
- Create `setStage(uint8 newStage)` function with OPERATOR_ROLE requirement
- Validate stage transitions to prevent invalid state changes
- Implement stage-specific access control and operation restrictions
- Generate comprehensive audit reports for stage changes

**Prerequisites:** Story 5.2 - Loan Withdrawal and Repayment Processing

---

### Story 5.4: Implement Operational Metrics and Monitoring

As a system manager,
I want comprehensive operational metrics and real-time monitoring,
So that I can oversee the entire mortgage portfolio and optimize operations.

**Acceptance Criteria:**

Given I am logged in as an operator
When I view the operator dashboard
Then I see portfolio-level metrics: total funded volume, active contracts, repayment status, investor count
And I can view individual contract metrics: funding progress, repayment history, investor distributions
And I see real-time alerts for important events (funding complete, repayments due, contract milestones)
And I can export operational reports for compliance and business analysis

Given I need detailed information about a specific contract
When I access contract analytics
Then I see comprehensive breakdowns: investor participation, payment schedules, distribution calculations
And I can view all historical events with complete audit trail
And I have access to performance metrics and compliance indicators
And I can generate custom reports for different stakeholders

Given there are multiple contracts in various stages
When I monitor the overall portfolio
Then I can identify trends and patterns across the portfolio
And I receive proactive alerts for potential issues or opportunities
And I have tools for portfolio optimization and risk management
And I can easily scale operations without additional administrative overhead

**Technical Notes:**
- Implement comprehensive analytics using contract event data and state variables
- Create real-time monitoring using WebSocket connections or polling
- Use data visualization libraries for charts and metrics display
- Implement alert system for important operational events
- Generate compliance reports automatically from contract data

**Prerequisites:** Story 5.3 - Contract Stage Management System

---

## Epic 6: Real-time Dashboard & Monitoring

**Epic Goal:** Provide investors and operators with real-time visibility into contract states, transaction activities, and portfolio performance through intuitive dashboards.

### Story 6.1: Implement Real-time Contract State Synchronization

As a user of the mortage-house platform,
I want to see real-time updates of contract states and transaction activities,
So that I always have accurate and current information about my investments.

**Acceptance Criteria:**

Given I am viewing any page with contract information
When contract state changes on-chain (new investment, repayment, withdrawal)
Then my interface updates automatically without page refresh
And I see real-time notifications for important events affecting my investments
And all contract metrics (funding progress, repayments, earnings) are synchronized instantly
And I can verify that displayed data matches on-chain reality

Given there are multiple users viewing the same contract
When a state change occurs
Then all users see the updates simultaneously in real-time
And race conditions are prevented through proper optimistic updates
And conflicting views are resolved with authoritative on-chain data
And performance remains acceptable even with high-frequency updates

Given network connectivity issues occur
When I lose connection to the blockchain
Then the interface gracefully handles connection interruptions
And I see clear indicators of connection status and data freshness
And the interface automatically resynchronizes when connection is restored
And cached data is clearly marked as potentially outdated

**Technical Notes:**
- Implement WebSocket connections or efficient polling for real-time updates
- Use Viem subscriptions for contract event monitoring
- Implement optimistic updates with rollback on transaction failures
- Create connection status indicators and error handling for network issues
- Use efficient data synchronization patterns to minimize unnecessary re-renders

**Prerequisites:** Epic 4 - Investor Portfolio Management Complete, Epic 5 - Operator Controls Complete

---

### Story 6.2: Create Comprehensive Audit Trail Interface

As a compliance officer (Compliance Carla),
I want to access complete audit trails for all contract activities,
So that I can verify regulatory compliance and maintain transparent records.

**Acceptance Criteria:**

Given I need to audit contract activities
When I access the audit trail interface
Then I can view complete chronological history of all contract events and transactions
And each entry includes: timestamp, actor, action, amounts, and blockchain verification links
And I can filter audit logs by date range, user, event type, or contract
And I can export audit reports in various formats for compliance documentation

Given I investigate a specific transaction
When I examine the audit details
Then I can see the complete transaction context including pre/post state changes
And I have access to all related events and their causal relationships
And I can independently verify every entry on blockchain explorers
And I understand the business purpose and compliance impact of each activity

Given regulatory compliance requires specific reporting
When I generate compliance reports
Then the system automatically compiles required data from audit trails
And reports include all necessary fields for regulatory submissions
And data integrity can be verified through blockchain hash comparisons
And historical reports can be reproduced exactly from stored audit data

**Technical Notes:**
- Use smart contract events as the authoritative source for audit trails
- Implement efficient event indexing and querying for large datasets
- Create data visualization for audit trail analysis and compliance monitoring
- Implement cryptographic verification of data integrity
- Ensure audit trails are immutable and tamper-evident

**Prerequisites:** Story 6.1 - Real-time State Synchronization

---

## FR Coverage Matrix

| FR ID | Priority | Description | Epic | Story(s) | Implementation Details |
|------|----------|-------------|------|----------|-----------------------|
| FR1 | Critical | Smart Contract Infrastructure | Epic 1 | Stories 1.1, 1.2, 1.3 | Foundry deployment with OpenZeppelin AccessControl, event system, security measures |
| FR2 | Critical | Fractional Investment System | Epic 3 | Stories 3.1, 3.2, 3.3 | invest() function with 1 USDT = 1 share model, real-time tracking, gas optimization |
| FR3 | Critical | Automated Distribution System | Epic 4 | Stories 4.1, 4.3 | Pro-rata calculations for principal/interest, instant withdrawal processing |
| FR4 | High | User Wallet Integration | Epic 2 | Stories 2.1, 2.2, 2.3 | Nuxt Web3 Modal, Viem integration, structured error handling |
| FR5 | High | Investor Portfolio Management | Epic 4 | Stories 4.2, 4.4 | Portfolio dashboard, performance tracking, transaction history |
| FR6 | High | Operator Management Interface | Epic 5 | Stories 5.1, 5.2, 5.3, 5.4 | Contract deployment, loan operations, stage management, metrics dashboard |
| FR7 | Medium | Secondary Marketplace | *Future Epic* | *Not in MVP* | Share trading with sell orders and matching (post-MVP feature) |
| FR8 | Medium | Real-time Monitoring and Alerts | Epic 6 | Stories 6.1, 6.2 | Contract state synchronization, audit trail interface |
| NFR1 | Critical | Security | Epic 1 | Stories 1.2, 1.4 | OpenZeppelin libraries, role-based access control, reentrancy protection |
| NFR2 | High | Performance | Epic 3 | Story 3.3 | Gas optimization <0.01 ETH, frontend load times <3 seconds |
| NFR3 | High | Reliability | Epic 6 | Story 6.1 | 99.9% uptime, error recovery, real-time synchronization |
| NFR4 | Medium | Scalability | Epic 1 | Story 1.1 | Multi-contract support architecture, efficient data structures |
| NFR5 | High | Usability | Epic 2 | Stories 2.1, 2.3 | Zero blockchain knowledge required, clear error messages |
| NFR6 | Critical | Compliance | Epic 6 | Story 6.2 | KYC/AML integration, complete audit trail, tax reporting |

---

## Summary

**Epic Breakdown Complete:** 6 epics delivering incremental user value from foundation infrastructure through advanced monitoring capabilities.

**Implementation Approach:**
- **Foundation First:** Epic 1 establishes secure, auditable smart contract infrastructure
- **User Experience Focus:** Epic 2-4 provide seamless investor journey from wallet connection to earnings withdrawal
- **Operational Excellence:** Epic 5 enables efficient mortgage lifecycle management for operators
- **Transparency & Trust:** Epic 6 delivers real-time visibility and comprehensive audit trails

**Technical Integration:**
- **Architecture Alignment:** All stories implement technical decisions from Architecture document
- **UX Pattern Consistency:** User interactions follow UX Design specifications for emotional journey
- **Security First:** Comprehensive access control, reentrancy protection, and audit trail implementation
- **Gas Optimization:** Target <0.01 ETH per operation through efficient contract design

**Business Value Delivery:**
- **MVP Ready:** Complete end-to-end mortgage funding cycle with fractional investment
- **Scalable Foundation:** Architecture supports expansion from single property to portfolio scale
- **Regulatory Compliant:** Comprehensive audit trails and transparent on-chain operations
- **User Trust Building:** Radical transparency with instant confirmations and verifiable calculations

**Development Ready:** Stories sized for single dev agent completion with complete acceptance criteria and technical implementation guidance.

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document incorporates complete PRD, Architecture, and UX Design context for comprehensive implementation guidance._