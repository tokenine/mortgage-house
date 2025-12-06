# Story 4.1: Implement Pro-rata Distribution Calculations

**Status:** ready-for-dev
**Epic:** 4 - Investor Portfolio & Withdrawal Management
**Created:** 2025-12-06
**Author:** BMad Ultimate Story Context Engine

---

## 🎯 Story Foundation

As an investor,
I want to automatically receive my fair share of principal and interest repayments,
so that I can trust the platform to calculate and distribute earnings accurately.

## ✅ Acceptance Criteria

### AC1: Principal Repayment Distribution
**Given** I own shares in an active mortgage contract
**When** the borrower makes a principal repayment
**Then** the smart contract calculates my pro-rata share automatically
**And** my entitled principal amount updates immediately: `(myShares / totalShares) * principalRepaid`
**And** the contract emits `PrincipalDeposited` event with total amount and distribution details
**And** I can withdraw my entitled principal amount instantly

### AC2: Interest Payment Distribution
**Given** I own shares in an active mortgage contract
**When** the borrower makes an interest payment
**Then** my entitled interest amount is calculated: `(myShares / totalShares) * interestAmount`
**And** my withdrawable interest balance updates in real-time
**And** the contract emits `InterestDeposited` event with allocation details
**And** I receive notification about available interest earnings

### AC3: Multiple Partial Repayments
**Given** there are multiple partial repayments over time
**When** I view my investment position
**Then** my total entitled amounts accumulate correctly across all repayments
**And** I can see detailed history of all repayment events and my allocations
**And** the platform prevents double-withdrawal of already withdrawn amounts
**And** all calculations are mathematically verifiable on-chain

---

## 🏗️ Developer Context Section

### 🔴 CRITICAL: Do Not Violate These Constraints

**SMART CONTRACT DEVELOPMENT:**
- MUST use OpenZeppelin v5+ libraries inherited from Epic 1 [Source: 1-2-mortgage-contract-core.md]
- MUST follow AccessControl pattern with OPERATOR_ROLE for repayment functions [Source: docs/architecture.md#Access Control Pattern]
- MUST use Solidity 0.8.19+ with built-in overflow protection [Source: 1-2-mortgage-contract-core.md]
- MUST emit events using exact naming from Architecture document [Source: docs/architecture.md#Required Event Names]

**FRONTEND INTEGRATION:**
- MUST extend existing useMortgageContract composable [Source: 2-2-mortgage-contract-composable.md]
- MUST use structured error handling system [Source: 2-3-structured-error-handling.md]
- MUST follow established reactive state patterns [Source: 2-1-nuxt-web3-setup.md]
- MUST maintain 99.9% calculation accuracy requirement [Source: docs/architecture.md#Non-Functional Requirements]

### 📊 Technical Requirements

**Smart Contract Functions to Implement/Extend:**

```solidity
// New functions needed in MortgageContract.sol
function depositPrincipal(uint256 amount) external onlyOperator;
function depositInterest(uint256 amount) external onlyOperator;
function withdrawPrincipal(uint256 amount) external;
function withdrawInterest(uint256 amount) external;

// New state variables needed
uint256 public principalRepaid;
uint256 public interestPaid;
mapping(address => uint256) public withdrawnPrincipal;
mapping(address => uint256) public withdrawnInterest;
```

**Frontend Composable Extensions:**

```typescript
// Extend useMortgageContract.ts with new functionality
const withdrawablePrincipal = computed(() => {
  // Calculate: user's entitled principal - already withdrawn
})

const withdrawableInterest = computed(() => {
  // Calculate: user's entitled interest - already withdrawn
})

// New functions needed
const withdrawPrincipal = async (amount: number) => { ... }
const withdrawInterest = async (amount: number) => { ... }
```

**Event System Requirements:**
- `PrincipalDeposited(address indexed from, uint256 amount, uint256 totalPrincipal, uint256 perShareAmount)`
- `InterestDeposited(address indexed from, uint256 amount, uint256 totalInterest, uint256 perShareAmount)`
- `PayoutWithdrawn(address indexed to, uint256 principalAmount, uint256 interestAmount)`

### 🎨 Architecture Compliance

**File Structure Requirements:**
```
/contracts/src/MortgageContract.sol (extend existing)
  - Add new state variables and functions
  - Maintain existing AccessControl and event patterns

/contracts/test/ (extend existing)
  - Add test files for distribution calculations
  - Add pro-rata calculation verification tests

/frontend/composables/useMortgageContract.ts (extend existing)
  - Add withdrawable amount calculations
  - Add withdrawal functions
  - Add reactive state for entitlements

/frontend/components/ (extend existing)
  - Withdrawal components if needed
  - Earnings display components
```

**Naming Conventions:**
- Functions: camelCase with descriptive names (`depositPrincipal`, `withdrawableAmount`)
- Events: Past tense with indexed parameters (`PrincipalDeposited`, `InterestDeposited`)
- Variables: descriptive with clear ownership (`withdrawnPrincipal[user]`)

**Gas Optimization Requirements:**
- Target <0.01 ETH per operation [Source: docs/architecture.md#Core Architectural Decisions]
- Use packed structs for storage optimization
- Minimize storage operations in loops
- Batch operations where possible

### 📚 Library & Framework Requirements

**Smart Contract Libraries:**
- OpenZeppelin v5+ (already integrated from Epic 1) [Source: 1-2-mortgage-contract-core.md]
- SafeMath is built into Solidity 0.8+ (no separate import needed)
- Must use existing AccessControl inheritance pattern

**Frontend Libraries:**
- Viem (already integrated from Epic 2) [Source: 2-2-mortgage-contract-composable.md]
- Nuxt 3 composables pattern (already established)
- Must use existing error handling system [Source: 2-3-structured-error-handling.md]

**Testing Requirements:**
- Foundry testing framework (already established from Epic 1) [Source: 1-4-foundry-test-suite.md]
- 100% code coverage requirement
- Mathematical accuracy testing with edge cases
- Gas usage verification

### 🧪 Testing Requirements

**Smart Contract Tests Must Include:**
1. **Pro-rata Calculation Accuracy**
   - Test single investor gets 100% of repayments
   - Test multiple investors get correct proportional shares
   - Test edge cases: 1 wei amounts, maximum amounts

2. **Double Withdrawal Prevention**
   - Test cannot withdraw same amount twice
   - Test partial withdrawals are tracked correctly
   - Test zero amount withdrawals are handled

3. **Multiple Repayment Events**
   - Test accumulation across multiple repayments
   - Test partial repayments over time
   - Test principal vs interest separation

4. **Access Control Security**
   - Test only OPERATOR_ROLE can call deposit functions
   - Test investor role restrictions
   - Test edge cases with role changes

**Frontend Tests Must Include:**
1. **Reactive State Updates**
   - Test withdrawable amounts update in real-time
   - Test calculations are reactive to contract events
   - Test loading states during transactions

2. **Error Handling**
   - Test structured error messages for invalid amounts
   - Test network error handling
   - Test validation for insufficient balances

### 🔍 Previous Story Intelligence

**Epic 3 Learnings (Investment Flow):**
- Investment functions established share ownership pattern [Source: 3-1-investment-function.md]
- Real-time state synchronization implemented [Source: 3-2-funding-progress.md]
- Gas optimization techniques for user operations established [Source: 3-3-gas-optimization.md]

**Epic 2 Learnings (Web3 Integration):**
- useMortgageContract composable provides solid foundation for contract interactions [Source: 2-2-mortgage-contract-composable.md]
- Structured error handling system ready for new withdrawal functions [Source: 2-3-structured-error-handling.md]
- Wallet integration patterns established for user operations [Source: 2-1-nuxt-web3-setup.md]

**Epic 1 Learnings (Smart Contract Foundation):**
- AccessControl pattern with OPERATOR_ROLE already implemented [Source: 1-2-mortgage-contract-core.md]
- Event system naming conventions established [Source: 1-3-event-system.md]
- Foundry testing patterns and coverage standards set [Source: 1-4-foundry-test-suite.md]

### 📋 Git Intelligence Summary

**Recent Commit Patterns:**
- Contract functions follow the pattern: validate → calculate → emit event → update state
- Frontend composables use reactive state with computed properties
- Tests include edge cases and gas optimization verification
- All development maintains 99.9% accuracy requirement

**File Creation Patterns:**
- New smart contract functions extend existing MortgageContract.sol
- Frontend components extend existing composable patterns
- Test files follow naming convention: ContractName.t.sol
- Documentation includes mathematical verification examples

### 🌐 Latest Technical Information

**Solidity 0.8.19+ Requirements:**
- Built-in overflow/underflow protection (no need for SafeMath)
- Fixed-point arithmetic libraries for precise financial calculations
- Gas optimization opportunities through packed structs

**Viem Integration:**
- Use existing Viem client from useMortgageContract composable
- Follow established patterns for contract interaction
- Maintain type safety for all blockchain operations

**Nuxt 3 Composables:**
- Extend existing useMortgageContract composable pattern
- Use reactive state management with computed properties
- Follow established error handling patterns

### 📖 Project Context Reference

**Architecture Alignment:**
- **Smart Contract Infrastructure**: Build on Epic 1 foundation with AccessControl and events [Source: docs/architecture.md#Smart Contract Architecture]
- **Frontend Architecture**: Use established composable and error handling patterns [Source: docs/architecture.md#Frontend Architecture]
- **Event System**: Follow required event naming for audit trail [Source: docs/architecture.md#Required Event Names]
- **Performance**: Maintain <0.01 ETH gas target and <3s frontend loads [Source: docs/architecture.md#Core Architectural Decisions]

**Epic Integration:**
- **Prerequisite**: Depends on Epic 3 (Investment Flow) for share ownership system
- **Foundation**: Enables Epic 4.2 (Portfolio Dashboard) with withdrawable amounts
- **Supports**: Epic 4.3 (Withdrawal Processing) with calculation backend
- **Critical for**: Platform trust and investor satisfaction

**Business Value:**
- **Core User Trust**: 99.9% calculation accuracy requirement [Source: docs/architecture.md#Non-Functional Requirements]
- **Regulatory Compliance**: Complete audit trail for all distributions
- **User Experience**: Instant withdrawal with transparent calculations
- **Platform Viability**: Essential for investor retention and platform success

**Mathematical Requirements:**
- **Precision**: Must handle fractional shares correctly
- **Accuracy**: 99.9% calculation accuracy mandatory
- **Verification**: All calculations must be mathematically verifiable on-chain
- **Security**: Prevent double withdrawals and manipulation

### 🔗 References

- [Architecture: Smart Contract Requirements](docs/architecture.md#Smart Contract Architecture)
- [Architecture: Event System Requirements](docs/architecture.md#Required Event Names)
- [Architecture: Performance Requirements](docs/architecture.md#Core Architectural Decisions)
- [Epic 1: Smart Contract Foundation](1-2-mortgage-contract-core.md)
- [Epic 2: Web3 Integration Foundation](2-2-mortgage-contract-composable.md)
- [Epic 3: Investment Flow](3-1-investment-function.md)
- [Epic 4 Details: Portfolio Management](docs/epics.md#Epic-4-Investor-Portfolio-and-Withdrawal-Management)

---

## 🎯 Dev Agent Execution Instructions

### Step 1: Extend Smart Contract
1. **Add new state variables** to MortgageContract.sol for tracking repayments and withdrawals
2. **Implement depositPrincipal()** function with OPERATOR_ROLE restriction and pro-rata calculations
3. **Implement depositInterest()** function with separate interest tracking
4. **Add withdrawal functions** with double-withdrawal protection
5. **Emit required events** with indexed parameters for audit trail

### Step 2: Extend Frontend Composable
1. **Add withdrawable amount calculations** to useMortgageContract.ts
2. **Implement withdrawal functions** using existing Viem client
3. **Add reactive state updates** for real-time balance tracking
4. **Integrate structured error handling** for all withdrawal operations

### Step 3: Comprehensive Testing
1. **Smart contract tests** for mathematical accuracy and edge cases
2. **Frontend tests** for reactive state and error handling
3. **Integration tests** for end-to-end withdrawal flow
4. **Gas optimization verification** to maintain <0.01 ETH target

### Step 4: Documentation
1. **Mathematical verification examples** showing calculation accuracy
2. **Event schema documentation** for audit trail integration
3. **Integration guide** for future epic development

### ✅ Success Criteria
- [ ] All smart contract functions compile and pass tests
- [ ] Pro-rata calculations achieve 99.9% accuracy
- [ ] Frontend composable extensions work seamlessly
- [ ] Double withdrawal prevention verified
- [ ] Gas optimization targets met
- [ ] Comprehensive test coverage achieved
- [ ] Mathematical verifiable on-chain

---

## 🚨 Critical Warning: Do Not Skip These Requirements

1. **MUST use existing AccessControl pattern** from Epic 1
2. **MUST extend existing useMortgageContract composable** from Epic 2
3. **MUST maintain 99.9% calculation accuracy** as per architecture
4. **MUST emit events using exact naming** from Architecture document
5. **MUST prevent double withdrawals** with proper state tracking
6. **MUST achieve gas optimization** <0.01 ETH per operation
7. **MUST include comprehensive tests** for mathematical accuracy

---

## Dev Agent Record

### Context Reference
<!-- Implementation context will be tracked here -->

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20251101)

### Debug Log References

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created

### File List (Expected)
- `/contracts/src/MortgageContract.sol` (extend existing)
- `/contracts/test/MortgageDistribution.t.sol` (new)
- `/frontend/composables/useMortgageContract.ts` (extend existing)
- Test coverage reports and gas optimization verification

**Status:** ready-for-dev