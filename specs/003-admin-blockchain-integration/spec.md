# Feature Specification: Admin Panel Real Blockchain Integration

**Feature Branch**: `003-admin-blockchain-integration`  
**Created**: 2025-12-14  
**Status**: Draft  
**Input**: User description: "Implement real blockchain integration for Admin Panel by replacing mock alert-based operations with actual smart contract interactions using Wagmi hooks, including distribute interest, distribute principal repayment, and withdraw principal functions"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interest Distribution with Real Blockchain Transaction (Priority: P1)

As a mortgage operator, I need to distribute interest payments to investors through actual smart contract transactions so that payments are verifiably recorded on-chain and investors receive their funds automatically.

**Why this priority**: Interest distribution is the core value proposition - investors expect transparent, automated payments. Mock implementations create false confidence and prevent testing of actual gas costs, transaction timing, and error scenarios.

**Independent Test**: Can be fully tested by connecting as issuer wallet, entering an interest amount, approving USDT allowance if needed, executing the distribution transaction, and verifying on-chain that investors receive pro-rata interest payments via the `InterestDistributed` event.

**Acceptance Scenarios**:

1. **Given** admin is connected with issuer wallet and has sufficient USDT balance, **When** admin enters interest amount and clicks "Distribute Interest", **Then** system checks USDT allowance, prompts for approval if needed, executes distributeInterest transaction, shows transaction confirmation toast, and displays updated contract state
2. **Given** admin enters interest amount greater than current USDT allowance, **When** admin clicks "Distribute Interest", **Then** system automatically triggers approve transaction first, waits for confirmation, then executes distributeInterest transaction
3. **Given** admin is viewing the admin panel, **When** another transaction completes on-chain, **Then** system automatically refetches contract data via event listeners and updates UI in real-time
4. **Given** distributeInterest transaction is pending, **When** user confirms in MetaMask, **Then** UI shows "Confirming..." state with loading indicator, waits for on-chain confirmation, then shows success toast

---

### User Story 2 - Principal Repayment Distribution (Priority: P2)

As a mortgage operator, I need to distribute principal repayment to investors through real blockchain transactions so that loan repayments are transparently recorded and investors can withdraw their principal portions.

**Why this priority**: Principal repayment is critical for loan lifecycle completion but occurs less frequently than interest payments. This should follow the same pattern as interest distribution.

**Independent Test**: Can be tested by entering principal repayment amount, approving tokens if needed, executing distributePrincipalRepayment transaction, and verifying investors' withdrawable principal increases proportionally via contract state.

**Acceptance Scenarios**:

1. **Given** admin has sufficient USDT and proper allowance, **When** admin enters principal amount and clicks "Distribute Principal", **Then** system executes distributePrincipalRepayment transaction, shows confirmation toast, and updates contract state showing increased withdrawable principal for investors
2. **Given** principal distribution transaction fails due to insufficient balance, **When** transaction is rejected, **Then** system shows error toast with clear message explaining the failure reason from contract revert
3. **Given** admin enters invalid principal amount (e.g., negative or non-numeric), **When** admin attempts to distribute, **Then** system validates input client-side and prevents transaction submission with helpful error message

---

### User Story 3 - Loan Principal Withdrawal (Priority: P2)

As a mortgage operator, I need to withdraw the total funded principal from the contract to the borrower's wallet via real blockchain transaction so that the loan funding can be disbursed to the borrower after successful funding completion.

**Why this priority**: Principal withdrawal is a one-time operation that closes the funding phase. Critical for loan lifecycle but occurs only once per property, making it P2 priority.

**Independent Test**: Can be tested by ensuring funding phase is active, executing withdrawPrincipal transaction as issuer, and verifying total funded amount is transferred to issuer wallet and funding phase is closed via contract state changes.

**Acceptance Scenarios**:

1. **Given** funding phase is active and total funded amount is greater than zero, **When** admin clicks "Withdraw Principal & Close Funding", **Then** system executes withdrawPrincipal transaction, transfers total USDT to issuer wallet, closes funding phase, emits PrincipalWithdrawn event, and shows success toast
2. **Given** funding phase is already closed, **When** admin attempts to withdraw principal, **Then** button is disabled with tooltip explaining funding is already closed
3. **Given** withdrawPrincipal transaction is processing, **When** user waits for confirmation, **Then** UI shows loading state on button, prevents duplicate submissions, and shows transaction hash link to block explorer

---

### User Story 4 - Real-time Contract State Synchronization (Priority: P3)

As a mortgage operator, I need to see real-time updates of contract state including funding status, total shares, and investor count so that I have accurate information for operational decisions without manual page refreshes.

**Why this priority**: Real-time updates enhance UX but are not blocking for core functionality. Can initially work with manual refresh, making this P3.

**Independent Test**: Can be tested by monitoring contract events (ShareListed, InvestmentMade, InterestDistributed, etc.) and verifying UI automatically updates when events are detected without page refresh.

**Acceptance Scenarios**:

1. **Given** admin panel is open with event listeners active, **When** an investment transaction completes on-chain, **Then** system detects InvestmentMade event, refetches contract data, and updates displayed total shares and investor count automatically
2. **Given** multiple rapid transactions occur, **When** events fire in quick succession, **Then** system debounces refetch calls to prevent excessive RPC requests while still showing updated data within 3 seconds
3. **Given** network connectivity is lost, **When** events cannot be received, **Then** system gracefully degrades to showing last known state with indicator that real-time updates are unavailable

---

### Edge Cases

- What happens when user rejects transaction in MetaMask? System should show error toast and return UI to ready state without leaving loading indicators
- How does system handle when admin wallet is not the issuer? System should check issuer address from contract and show "Access denied" message if connected wallet doesn't match
- What happens when USDT allowance is exactly equal to distribution amount? System should proceed directly to distribution without approval step
- How does system handle when transaction reverts due to contract state (e.g., funding already closed)? System should parse revert reason and show user-friendly error message
- What happens when user switches wallet accounts while transaction is pending? System should detect account change via Wagmi and show appropriate state
- How does system handle when RPC connection is slow or unavailable? System should show loading states and timeout gracefully with retry option

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch all contract state data (issuer, isFundingActive, allowance, shares) using Wagmi's useReadContract hook from actual smart contract
- **FR-002**: System MUST execute distributeInterest transaction using useWriteContract hook with proper transaction confirmation via useWaitForTransactionReceipt
- **FR-003**: System MUST execute distributePrincipalRepayment transaction using useWriteContract hook with proper confirmation
- **FR-004**: System MUST execute withdrawPrincipal transaction using useWriteContract hook with proper confirmation
- **FR-005**: System MUST check USDT allowance before distribution transactions and automatically trigger approve transaction if allowance is insufficient
- **FR-006**: System MUST display transaction states (idle, pending, confirming, success, error) using toast notifications from Sonner library
- **FR-007**: System MUST prevent duplicate transaction submissions while a transaction is pending or confirming
- **FR-008**: System MUST verify connected wallet address matches contract issuer address before showing admin controls
- **FR-009**: System MUST listen to contract events (InterestDistributed, PrincipalRepaymentDistributed, PrincipalWithdrawn) and automatically refetch data when events are detected
- **FR-010**: System MUST use getMortgageBondConfig helper to retrieve contract address and ABI from projects.json configuration
- **FR-011**: System MUST use getPaymentTokenConfig helper to retrieve USDT token address and ABI for approval transactions
- **FR-012**: System MUST parse amount inputs as BigInt with proper decimal handling (6 decimals for USDT) using viem's parseUnits
- **FR-013**: System MUST show loading indicators on buttons during transaction confirmation periods
- **FR-014**: System MUST disable withdraw principal button when isFundingActive is false
- **FR-015**: System MUST clean up event listeners when component unmounts to prevent memory leaks
- **FR-016**: System MUST NOT use alert(), console.log(), or static success messages as replacements for real blockchain state
- **FR-017**: System MUST validate input amounts client-side before attempting transactions (positive numbers, numeric format)
- **FR-018**: System MUST handle transaction errors gracefully by parsing revert reasons and displaying user-friendly error messages
- **FR-019**: System MUST refetch allowance after approval transaction completes to enable immediate distribution
- **FR-020**: System MUST batch multiple contract reads together using useReadContracts for efficiency

### Key Entities

- **AdminPanel Hook**: Encapsulates all admin panel blockchain interactions including read operations (issuer check, funding status, allowance) and write operations (approve, distributeInterest, distributePrincipal, withdrawPrincipal) with proper state management
- **Transaction State**: Tracks lifecycle of each write transaction (idle → pending → confirming → success/error) with corresponding UI feedback
- **Contract Configuration**: Project-specific contract addresses and ABIs stored in projects.json and accessed via helper functions
- **Event Listeners**: WebSocket connections to blockchain RPC watching for contract events to trigger automatic data refetching
- **Allowance State**: Current USDT approval amount for the contract address, determines whether approval transaction is needed before distributions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can complete an interest distribution transaction from button click to on-chain confirmation in under 30 seconds (excluding user MetaMask confirmation time)
- **SC-002**: System correctly checks and handles allowance in 100% of distribution attempts, automatically prompting for approval when needed
- **SC-003**: All transaction states (pending, confirming, success, error) are clearly communicated to user via toast notifications within 1 second of state change
- **SC-004**: Contract state updates automatically within 3 seconds of on-chain event detection without requiring manual page refresh
- **SC-005**: Zero instances of mock alert() or console.log() used for user feedback in production code
- **SC-006**: Admin panel correctly denies access to non-issuer wallets 100% of the time by verifying on-chain issuer address
- **SC-007**: System handles transaction rejections gracefully, returning UI to ready state and showing appropriate error message in 100% of cases
- **SC-008**: Gas estimation and transaction execution succeed for all admin operations when executed with proper permissions and sufficient balance
- **SC-009**: Event listeners are properly cleaned up on component unmount, verified by zero memory leaks in browser dev tools after 10+ navigation cycles
- **SC-010**: All blockchain interactions use real Wagmi hooks (useReadContract, useWriteContract, useWaitForTransactionReceipt) with zero mock implementations

## Assumptions *(optional)*

- Admin users have MetaMask or compatible Web3 wallet installed and connected
- Issuer wallet has sufficient USDT balance to cover distribution amounts plus gas fees
- RPC endpoint is reliable and responsive (sub-second response time for contract reads)
- Users understand basic Web3 concepts (transaction confirmation, gas fees, wallet signatures)
- Contract is already deployed and address is configured in projects.json
- USDT token contract implements standard ERC20 approve/transferFrom pattern
- Only one admin operation should occur at a time per user (single transaction queue)

## Dependencies *(optional)*

- Wagmi library for React hooks (useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient)
- Viem library for Ethereum utilities (parseUnits, formatUnits, address handling)
- Sonner library for toast notifications
- Existing useTransactionWithToast hook for standardized transaction state management
- Existing getMortgageBondConfig and getPaymentTokenConfig helpers
- MortgageContract.sol deployed with distributeInterest, distributePrincipalRepayment, withdrawPrincipal functions
- USDT token contract address configured per project in projects.json

## Out of Scope *(optional)*

- Support for multiple simultaneous admin operations (will queue transactions)
- Batch distribution to specific investor subsets (distributes to all investors pro-rata)
- Historical transaction log UI (events are emitted but UI just shows current state)
- Gas price optimization controls (uses wallet's default gas settings)
- Multi-signature approval workflow for admin operations
- Support for native ETH distributions (only USDT supported)
- Admin panel analytics dashboard (separate feature)
- Investor notification system for distributions (handled elsewhere)
