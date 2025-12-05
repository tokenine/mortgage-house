---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: ['product-brief-mortage-house-2025-12-05.md', 'tech-spec-mortage-house-smart-contract-2025-12-05.md']
workflowType: 'architecture'
lastStep: 1
project_name: 'mortage-house'
user_name: 'Poom-work'
date: '2025-12-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- Single smart contract per property managing one complete mortgage lifecycle
- Fractional investment system with 1 USDT = 1 share model
- Automated pro-rata distribution of principal and interest payments
- Investor dashboard for investment monitoring and withdrawals
- Master wallet operator controls for contract management
- Real-time contract state tracking and transparency
- Complete on-chain audit trail for all transactions

**Non-Functional Requirements:**
- **Security**: Smart contract security with OpenZeppelin libraries, 99.9% distribution accuracy
- **Performance**: Gas optimization targeting <0.01 ETH per operation
- **Transparency**: All transactions verifiable on-chain with real-time state visibility
- **Compliance**: Hybrid model maintaining off-chain legal frameworks while automating on-chain
- **Usability**: Zero blockchain knowledge required for complete mortgage lifecycle
- **Reliability**: Zero manual calculations for investor distributions

**Scale & Complexity:**
- Primary domain: Blockchain/DeFi platform with Web3 frontend
- Complexity level: Medium (complex financial logic in isolated scope)
- Estimated architectural components: 8-10 core components (contract, frontend, services, utilities)

### Technical Constraints & Dependencies

- **Blockchain Platform**: Ethereum Mainnet with Polygon deployment option
- **Token Standard**: USDT (ERC-20) for all value transfers
- **Smart Contract Language**: Solidity with Hardhat development framework
- **Frontend**: React with TypeScript for Web3 integration
- **Development Approach**: Greenfield project establishing new patterns
- **Gas Optimization**: Critical for user experience and adoption

### Cross-Cutting Concerns Identified

- **Security**: Smart contract audit requirements, access control, reentrancy protection
- **Gas Optimization**: Every operation must minimize transaction costs
- **State Management**: Real-time synchronization between contract and frontend
- **Error Handling**: Clear user feedback for blockchain operations
- **Regulatory Compliance**: Off-chain legal wrapper with on-chain execution
- **Mathematical Accuracy**: Precision in pro-rata calculations and distributions

## Starter Template Evaluation

### Primary Technology Domain

Blockchain/DeFi platform for fractional mortgage funding and automated distribution, with:

Monolithic smart contract design (one main contract per property)

Nuxt 3 Web frontend with wallet interaction and simple admin panel

### Starter Options Considered

**Custom Foundry + Nuxt 3 Monorepo (Selected)**

Foundry for smart contracts (fast, modern, test-first)

Nuxt 3 + Vite for the frontend

Nuxt UI + MCP for AI-assisted development and contract integration

**Scaffold-ETH**

Great learning tool with heavy React/Hardhat integration

More opinionated, but not aligned with our Nuxt + Foundry direction

### Selected Starter: Custom Foundry + Nuxt 3 Monorepo

**Rationale for Selection**

We want a monolith smart contract design with:

Clear core logic

Strong testing and simulation support

Easy refactoring as the protocol evolves

Foundry is:

Blazing fast for compile/test

Great for unit + integration tests

Native to Solidity devs (no JS test glue required)

Nuxt 3 + Vite:

Fits the MVP need for a simple, SSR-capable, modern SPA-style dashboard

Great DX with file-based routing and auto-imports

Nuxt UI AI MCP:

Allows AI-assisted flows directly inside the frontend stack

Lets us script interactions and potentially scaffold UI/contract bindings faster than manual wiring

This stack is aligned with the MVP goal:

One property mortgage, fully on-chain through a Foundry contract, with a Nuxt dashboard for investors and operators.

**Initialization Commands**

Contracts (Foundry):

```bash
forge init mortage-house-contracts
```

(or if using a monorepo, this lives under /contracts)

Frontend (Nuxt 3 + Nuxt UI + MCP):

```bash
npx nuxi init mortage-house-frontend
# then inside the frontend
npm install @nuxt/ui @nuxt/ui-pro # (or just @nuxt/ui)
# enable Nuxt UI + AI MCP in nuxt.config.ts
```

**Note:** In the final repo, we will likely structure it as:

/contracts → Foundry project

/frontend → Nuxt 3 project

With shared config/scripts at the root if needed.

**Architectural Decisions Provided by Our Stack**

**Language & Runtime**

Smart Contracts

Solidity with Foundry toolchain

Monolithic contract design (one main mortgage contract per property, possibly from a factory later)

forge test for fast unit/integration tests

Frontend

Nuxt 3 (Vue 3) with full TypeScript support

Vite as the dev server and bundler

SSR/SPA hybrid capabilities for dashboard-style UX

**Styling & UI**

Nuxt UI (component library) as the baseline

Prebuilt components: cards, tables, forms → perfect for investor/operator dashboards

Easy customization for brand

Optional future addition: Tailwind CSS (Nuxt UI is Tailwind-based under the hood)

**Build Tooling**

Contracts:

Foundry (forge build, forge test, forge script) for:

Compilation

Testing

Deployment scripts

Frontend:

Vite via Nuxt 3 for:

Fast dev builds

HMR (hot module replacement)

Optimized production builds

**Testing Framework**

Smart Contracts

Foundry testing with forge test

Can simulate:

Funding flow

Loan withdrawal

Principal + interest repayment

Investor withdrawal

Frontend

MVP: manual testing + basic E2E checks

Can later add:

Vitest / Playwright as needed

**Code Organization**

Clear separation:

/contracts → all Solidity, Foundry config, deployment scripts

/frontend → all Nuxt 3 pages, components, and composables

Smart contract is monolithic per mortgage:

One contract per property, handling:

Investments

Shares

Capital + interest accounting

Withdrawals

**Development Experience**

Foundry:

Fast compile/test loop

Built-in local chain testing

Nuxt 3 + Nuxt UI AI MCP:

Built-in AI integration layer for:

Generating UI components quickly

Assisting with contract interaction scaffolding

Wallet integration (planned):

Use ethers/web3modals from Nuxt to:

Connect a wallet

Call invest, withdraw, depositPrincipal, depositInterest

Keep it minimal and MVP-focused

**Note:** MVP Implementation Story

Project initialization with this stack should be the first implementation story:

1. Initialize Foundry project for the monolith mortgage contract
2. Initialize Nuxt 3 project with Nuxt UI + MCP for the dashboard UI
3. Add a minimal "Connect Wallet + Invest + Withdraw" flow wired to a local test deployment of the contract

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- OpenZeppelin AccessControl for role-based permissions (DEFAULT_ADMIN, OPERATOR, INVESTOR roles)
- Nuxt Web3 Modal + Viem for type-safe blockchain integration
- Comprehensive Foundry Testing with full lifecycle simulation
- Optimism Testnet deployment for L2 testing with Ethereum ecosystem compatibility

**Important Decisions (Shape Architecture):**
- Component + E2E frontend testing with Vitest + Playwright
- Vercel for frontend deployment with preview environments
- Monolithic contract design per property for MVP clarity

**Deferred Decisions (Post-MVP):**
- Multi-chain deployment strategy
- Advanced caching strategies
- CI/CD pipeline automation

### Smart Contract Architecture

**Access Control Pattern:**
- OpenZeppelin AccessControl with role-based permissions
- DEFAULT_ADMIN_ROLE: Contract owner/administration
- OPERATOR_ROLE: Master wallet (borrower) for loan operations
- INVESTOR_ROLE: Public role for investing/withdrawing
- Reentrancy protection on all external calls

**Contract Structure:**
- Single MortgageContract.sol per property
- Clear separation between investor functions and operator functions
- Events for all major operations (invest, withdraw, deposit, repay)
- Precision arithmetic for pro-rata calculations

**Security Measures:**
- OpenZeppelin ReentrancyGuard for external calls
- Pausable pattern for emergency stops
- Integer overflow/underflow protection (Solidity 0.8+)
- Input validation on all parameters

### Frontend Architecture

**Blockchain Integration:**
- Nuxt Web3 Modal + Viem for wallet connectivity
- Type-safe contract interaction with auto-generated ABIs
- Composables pattern: useMortgageContract(), useWalletConnection()
- Real-time state synchronization with contract events

**State Management:**
- Pinia for global application state
- Reactive contract state through Viem subscriptions
- Local state for UI components, global state for wallet/contract data
- Error boundaries for blockchain operation failures

**Component Architecture:**
- Page-based routing (/, /invest, /operator, /portfolio)
- Reusable components: WalletButton, TransactionModal, MetricsCard
- Nuxt UI components as base library with custom extensions
- TypeScript interfaces for all contract data structures

### Testing Strategy

**Smart Contract Testing:**
- Comprehensive Foundry testing with >95% coverage
- Scenario testing: full investment lifecycle simulation
- Edge case testing: partial withdrawals, failed payments, boundary conditions
- Gas optimization testing to ensure <0.01 ETH per operation target
- Security testing: reentrancy, access control, arithmetic overflow

**Frontend Testing:**
- Vitest for component unit testing with Vue Test Utils
- Playwright for E2E testing of critical user journeys
- Contract mocking for isolated component testing
- Wallet connection testing across multiple providers
- Error state testing for blockchain failures

### Deployment Architecture

**Smart Contract Deployment:**
- Optimism Testnet for L2 testing with Ethereum ecosystem compatibility
- Hardhat/Viem deployment scripts with verification
- Environment configuration for testnet/mainnet deployment
- Automated contract verification on Etherscan/Optimism Explorer

**Frontend Deployment:**
- Vercel for zero-config Nuxt 3 deployment
- Preview deployments for feature branches
- Edge optimization for global performance
- Environment variables for network configuration

**Infrastructure Monitoring:**
- Vercel Analytics for frontend performance
- Custom dashboard for contract state monitoring
- Error tracking for blockchain operation failures
- Gas usage tracking for optimization opportunities

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialize Foundry project with AccessControl integration
2. Deploy basic MortgageContract to Optimism testnet
3. Set up Nuxt 3 project with Web3 Modal + Viem
4. Implement core composables for contract interaction
5. Build comprehensive test suite for contracts and frontend
6. Deploy to production with verified contracts

**Cross-Component Dependencies:**
- Contract ABI generation required for frontend type safety
- Access control roles must align with frontend permission logic
- Gas optimization impacts frontend transaction UX
- Testing strategy requires contract deployment automation

**Note:** These decisions establish a secure, scalable foundation for your mortgage platform while prioritizing the low-cost, user-friendly experience required for fractional investments using Optimism's L2 infrastructure.

## 🔧 AI-Agent Conflict Prevention & Development Conventions

Because multiple AI agents will eventually collaborate on this codebase, we must predefine strict development conventions. Otherwise, agents will generate inconsistent smart contract events, composables, file structures, or error types — breaking integration between contract, frontend, and indexing logic.

This section defines patterns all agents must follow.

### 1. Smart Contract Event Naming Patterns

Different agents may choose different event naming styles:

| Style | Example |
|-------|---------|
| Past Tense + Context | InvestmentMade, LoanWithdrawn |
| Action + Object | MakeInvestment, WithdrawLoan |
| Simple Past | Invested, Withdrawn, Deposited |

✅ **Pattern Decision: Simple Past Tense**

This is clean, conventional, short, and matches standard DeFi event names.

**Required Event Names (MVP, including trading):**

**Mortgage Lifecycle**
- `MortgageInitialized(address indexed borrower, uint256 loanAmount, address asset)`
- `StageChanged(uint8 indexed oldStage, uint8 indexed newStage, address indexed actor)`

**Funding & Borrowing**
- `Invested(address indexed investor, uint256 amount, uint256 shares)`
- `LoanWithdrawn(address indexed borrower, uint256 amount)`

**Repayment Events**
- `PrincipalDeposited(address indexed from, uint256 amount)`
- `InterestDeposited(address indexed from, uint256 amount)`

**Investor Payouts**
- `PayoutWithdrawn(address indexed investor, uint256 principalAmount, uint256 interestAmount)`

**Trading Marketplace Events (MVP)**
- `SharesTransferred(address indexed from, address indexed to, uint256 amount)`
- `OrderCreated(uint256 indexed orderId, address indexed seller, uint256 shareAmount, uint256 totalPrice)`
- `OrderCancelled(uint256 indexed orderId, address indexed seller)`
- `OrderFilled(uint256 indexed orderId, address indexed buyer, uint256 shareAmount, uint256 totalPrice, uint256 feeAmount)`
- `FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps, address indexed actor)`

### 2. Frontend ↔ Contract Integration Pattern

Agents may create different composables: `useMortgage`, `useMortgageInvestment`, `useContractRead`, or one giant file. To avoid fragmentation, we enforce one pattern.

✅ **Pattern Decision: Entity-Based Composable**

All contract logic must be implemented in:
```
composables/useMortgageContract.ts
```

This composable is the single source of truth for:
- Contract instance creation
- Reads
- Writes
- Error handling
- Event listening
- Derived UI state

**Required API Shape:**
```typescript
const {
  contract,
  stage,
  stats, // totalFunded, repaidPrincipal, repaidInterest...
  investorPosition, // shares, entitledPrincipal, entitledInterest, withdrawable values...
  invest,
  withdrawPayout,
  withdrawLoan,
  depositPrincipal,
  depositInterest,
  refreshState,
  createSellOrder,
  cancelSellOrder,
  buySellOrder,
  transferShares,
  lastError,
} = useMortgageContract();
```

No contract calls may be made directly inside components/pages. All must go through this composable.

### 3. Error Message Format

Different agents may output errors differently: Structured, Simple message, or Code-based only. Because blockchain errors need classification, we pick a structured type.

✅ **Pattern Decision: Structured Error Type**
```typescript
type MortgageError = {
  scope: 'CONTRACT' | 'FRONTEND' | 'NETWORK';
  type: string;     // e.g., 'INVALID_STAGE', 'UNAUTHORIZED', 'INSUFFICIENT_SHARES'
  code?: string;    // optional: 'ERR_001', RPC codes, etc.
  message: string;  // human-readable explanation
}
```

All composables must expose:
```typescript
lastError: Ref<MortgageError | null>
```
and update it consistently.

### 4. File Organization for Nuxt 3

Agents often differ in folder structure: Nuxt Convention, Feature-based folders, or Hybrid.

✅ **Pattern Decision: Nuxt Convention**

**Required structure:**
```
frontend/
  composables/
    useMortgageContract.ts
    useWallet.ts (optional)
  utils/
    mortgage/
      format.ts
      math.ts
  pages/
    index.vue          // Investor dashboard
    admin.vue          // Master wallet controls
    market.vue         // Marketplace trading
```

**Rules:**
- Auto-import behavior must be preserved
- All contract utilities stay in `composables/`
- Formatting/calculation lives in `utils/mortgage/*`

### 5. Testing Pattern (Foundry)

Agents may output `test/`, `tests/`, or nested folders.

✅ **Pattern Decision: Foundry Standard**
```
contracts/
  src/
  script/
  test/
    Mortgage.t.sol
    MortgageFunding.t.sol
    MortgageTrading.t.sol
```

Use only:
- `forge test`
- `forge script`
- Foundry assertions (not JS testing for contracts)

### 6. Trading MVP Consistency Requirements

To avoid agent drift, the trading logic must follow these rules:

**Trading pattern:**
- Fixed-price sell orders
- Full fill only (no partials)
- Sell-only marketplace
- Shares locked on order creation
- Buyer pays totalPrice USDT
- Seller receives payment minus fee
- Order auto-inactivates after fill/cancel

**Required contract functions:**
```solidity
function transferShares(address to, uint256 amount) external;
function createSellOrder(uint256 shareAmount, uint256 totalPrice) external;
function cancelSellOrder(uint256 orderId) external;
function buySellOrder(uint256 orderId) external;
```

Must emit the standard marketplace events listed above.

### 7. Summary of Final Decisions (for all AI agents)

| Area | Pattern | Required Rule |
|------|---------|---------------|
| Event names | Simple past tense | Must use predefined event list |
| Composable pattern | Entity-based | Single `useMortgageContract` file |
| Error schema | Structured | Must follow `MortgageError` type |
| Nuxt file structure | Nuxt Convention | Use `composables/` and `utils/` |
| Testing | Foundry default | Tests in `contracts/test` |
| Trading MVP | Fixed-price full-fill marketplace | Must use locked shares + mandatory events |

📌 **Everything now aligns with:**
- Foundry monolithic contract
- Nuxt 3 frontend
- TypeScript
- Marketplace trading
- Multi-agent robust development