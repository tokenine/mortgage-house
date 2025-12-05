# Story 3.1: Implement Investment Function with Share Issuance

Status: ready-for-dev

## Story

As an investor (Savvy Sarah),
I want to invest USDT in mortgage contracts and receive shares instantly,
So that I can participate in fractional mortgage funding starting from 1 USDT.

## Acceptance Criteria

1. **Investment Display**: Contract shows funding progress, total funded amount, and investor's potential ownership percentage
2. **Real-time Share Calculation**: Investment amount input displays real-time share calculation (1 USDT = 1 share) with instant visual feedback
3. **Gas Estimate Display**: Clear "Invest" button shows gas estimate and transaction preview before confirmation
4. **Smart Contract Integration**: Invest function calls smart contract `invest(uint256 amount)` with proper USDT transfer validation
5. **Instant Share Issuance**: Shares are issued to investor wallet address immediately (1 share per USDT) with atomic transaction
6. **Event Emission**: Contract emits `Invested(address indexed investor, uint256 amount, uint256 shares)` event on successful investment
7. **Real-time State Updates**: Investor's ownership percentage and withdrawable amounts update immediately without page refresh
8. **Transaction Confirmation**: Success confirmation shows transaction link to block explorer with investment details

## Tasks / Subtasks

- [ ] Implement investment display component (AC: 1)
  - [ ] Create funding progress bar showing current vs target amount
  - [ ] Display total funded amount and remaining funding capacity
  - [ ] Calculate and display potential ownership percentage based on investment amount
  - [ ] Show investor count and contract stage information
- [ ] Create real-time share calculation interface (AC: 2)
  - [ ] Implement investment amount input with USDT validation (min: 1 USDT)
  - [ ] Create real-time share calculation (1 USDT = 1 share) as user types
  - [ ] Display projected ownership percentage after investment
  - [ ] Validate maximum investment amount against remaining funding needed
- [ ] Add gas estimation and transaction preview (AC: 3)
  - [ ] Implement gas estimation for investment transaction using useMortgageContract composable
  - [ ] Display gas cost in both ETH and USD equivalent
  - [ ] Create transaction preview showing investment details and fees
  - [ ] Add network condition awareness for gas pricing
- [ ] Implement smart contract investment function (AC: 4)
  - [ ] Add `invest(uint256 amount)` function to MortgageContract smart contract
  - [ ] Implement OpenZeppelin SafeERC20 for secure USDT transfers
  - [ ] Validate investment amount against minimum (1 USDT) and maximum requirements
  - [ ] Ensure atomic transaction: USDT transfer + share issuance in single operation
- [ ] Create instant share issuance system (AC: 5)
  - [ ] Update `shares[investor]` state variable atomically with investment
  - [ ] Update `totalFunded` contract state variable immediately
  - [ ] Issue shares using 1 USDT = 1 share model precisely
  - [ ] Prevent double investment or race conditions with ReentrancyGuard
- [ ] Implement event emission for investment tracking (AC: 6)
  - [ ] Add `Invested` event with indexed investor address, amount, and shares
  - [ ] Emit event after successful state update in contract
  - [ ] Include all relevant data for audit trail and real-time updates
  - [ ] Follow AI-Agent Conflict Prevention "Simple Past Tense" naming
- [ ] Create real-time UI state synchronization (AC: 7)
  - [ ] Use useMortgageContract composable event listeners for `Invested` events
  - [ ] Update investor position immediately after successful transaction
  - [ ] Update funding progress bar without page refresh
  - [ ] Refresh contract metrics and investor statistics in real-time
- [ ] Add transaction confirmation and feedback (AC: 8)
  - [ ] Display success confirmation with transaction details
  - [ ] Provide link to block explorer for transaction verification
  - [ ] Show updated investment position and ownership percentage
  - [ ) Include error handling for failed transactions with recovery suggestions

## Dev Notes

### Architecture Compliance
- **Event Naming**: Must use "Simple Past Tense" convention: `Invested` event [Source: docs/architecture.md#Required Event Names]
- **Frontend Pattern**: Must use Entity-Based Composable pattern [Source: docs/architecture.md#Entity-Based Composable]
- **Error Handling**: Must follow structured MortgageError type [Source: docs/architecture.md#Error Message Format]
- **Gas Optimization**: Target <0.01 ETH per operation [Source: docs/architecture.md#Core Architectural Decisions]

### Smart Contract Implementation
**Investment Function Requirements:**
```solidity
function invest(uint256 amount) external nonReentrant onlyRole(INVESTOR_ROLE) {
    // Validate investment amount
    require(amount >= 1e6, "Minimum investment is 1 USDT");
    require(amount <= getRemainingFunding(), "Exceeds funding capacity");

    // Transfer USDT from investor to contract
    IERC20(USDT_ADDRESS).transferFrom(msg.sender, address(this), amount);

    // Issue shares (1 USDT = 1 share)
    uint256 shares = amount;
    shares[msg.sender] += shares;
    totalShares += shares;
    totalFunded += amount;

    emit Invested(msg.sender, amount, shares);
}
```

### Frontend Integration Requirements
**useMortgageContract Composable Usage:**
```typescript
// Investment interface using the established composable
const {
  contract,
  stats, // totalFunded, repaidPrincipal, repaidInterest...
  investorPosition, // shares, ownershipPercentage...
  invest,
  lastError,
} = useMortgageContract();

// Investment execution
const handleInvest = async (amount: bigint) => {
  try {
    const gasEstimate = await contract.estimateGas.invest(amount);
    // Show gas estimate to user
    const tx = await invest(amount);
    // Handle success confirmation
  } catch (error) {
    // Handle structured error display
  }
};
```

### Real-time Event Handling
**Event Listener Implementation:**
```typescript
// Listen for investment events from other investors
useMortgageContract.on('Invested', (investor, amount, shares) => {
  // Update funding progress in real-time
  // Refresh contract stats without page refresh
  // Show notification about new investment activity
});

// Listen for user's own investment confirmation
useMortgageContract.on('Invested', (investor, amount, shares) => {
  if (investor.toLowerCase() === walletAddress.value.toLowerCase()) {
    // Update user's investment position
    // Show success confirmation
    // Refresh investor portfolio view
  }
});
```

### User Experience Requirements
- **Zero Blockchain Knowledge**: Interface must be intuitive for non-crypto users [Source: NFR5]
- **Instant Feedback**: Real-time share calculation and ownership percentage display
- **Gas Transparency**: Clear gas cost display before transaction confirmation
- **Transaction Confirmation**: Success state with block explorer verification
- **Error Recovery**: Clear error messages with actionable recovery steps

### Technical Integration Points
- **Epic 1**: Uses MortgageContract with event system and AccessControl
- **Epic 2**: Depends on useMortgageContract composable and structured error handling
- **Smart Contract**: Implements `invest()` function with proper ERC20 token integration
- **Real-time Updates**: Leverages event system for instant UI synchronization

### Gas Optimization Considerations
- **Single Transaction**: USDT transfer + share issuance in one atomic operation
- **Efficient Storage**: Use packed structs for investor data
- **Event Optimization**: Indexed parameters for efficient filtering
- **Batch Operations**: Consider batch investment options for power users

### Security Requirements
- **Reentrancy Protection**: All external functions use `nonReentrant` modifier
- **Input Validation**: Strict validation of investment amounts and boundaries
- **Token Security**: Use OpenZeppelin SafeERC20 for secure USDT transfers
- **Access Control**: Investment limited to INVESTOR_ROLE only

### Mathematical Precision
- **Share Calculation**: 1 USDT = 1 share model for fractional ownership
- **Ownership Percentage**: `(userShares / totalShares) * 100` with precise calculation
- **Funding Progress**: `totalFunded / loanAmount * 100` percentage calculation
- **Precision Handling**: Use 6 decimals for USDT amounts, ensure no rounding errors

### Testing Requirements
- **Unit Tests**: Test investment function with various amounts and conditions
- **Integration Tests**: Test frontend-backend interaction with real contract
- **Edge Cases**: Zero investment, maximum investment, insufficient funds scenarios
- **Gas Tests**: Verify gas costs remain under 0.01 ETH target

### Previous Story Intelligence
- **Epic 1**: Smart contract foundation with events and AccessControl complete
- **Epic 2**: useMortgageContract composable provides contract interaction layer
- **Event System**: `Invested` event pattern established for real-time updates
- **Gas Optimization**: Foundation and measurement tools ready for optimization

### Future Epic Dependencies
- **Epic 4**: Investment positions and earnings tracking for portfolio management
- **Epic 5**: Investment data for operator dashboard and contract management
- **Epic 6**: Investment events for real-time monitoring and audit trails

### Project Context Reference

**Architecture Alignment:**
- Smart Contract Infrastructure: Investment function built on Epic 1 foundation [Source: docs/architecture.md]
- Frontend Architecture: Uses established composable pattern [Source: docs/architecture.md#Frontend Architecture]
- Event System: Follows required event naming and indexing [Source: docs/architecture.md#AI-Agent Conflict Prevention]
- Gas Optimization: Target <0.01 ETH per operation [Source: docs/architecture.md#Core Architectural Decisions]

**Epic Integration:**
- Core user value proposition for the mortage-house platform
- Enables fractional mortgage investment starting from 1 USDT
- Foundation for portfolio management and earnings tracking
- Critical for platform business model and user acquisition

**Development Path:**
- Depends on Epic 1: Smart contract infrastructure
- Depends on Epic 2: User interface and error handling
- Enables Epic 4: Portfolio management and earnings tracking
- Supports Epic 5: Operator contract management

### References

- [Architecture: Required Event Names](docs/architecture.md#Required Event Names)
- [Architecture: Entity-Based Composable](docs/architecture.md#Entity-Based Composable)
- [Architecture: Error Message Format](docs/architecture.md#Error Message Format)
- [Previous Epic: Epic 2 Frontend Foundation](2-2-mortgage-contract-composable.md)
- [Previous Epic: Epic 1 Smart Contract Foundation](1-4-foundry-test-suite.md)
- [Epic 3 Details: Investment Flow](docs/epics.md#Epic-3-Mortgage-Contract-Investment-Flow)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List