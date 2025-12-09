# Feature Specification: Mortgage Platform

**Feature Branch**: `001-mortgage-platform`  
**Created**: 2025-12-09  
**Status**: Draft  
**Input**: User description: "monolith web3 project. use foundry for smartcontract testing and deployment. use nextjs for frontend using viem for wallet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Property Investment Flow (Priority: P1)

As an investor, I want to browse available mortgage properties, view detailed information, and invest directly through the platform so that I can easily access real estate investment opportunities.

**Why this priority**: Core functionality - without investment capability, platform has no value proposition

**Independent Test**: Can be fully tested by connecting wallet, viewing property details, and making a test investment. Delivers complete investment journey from discovery to ownership.

**Acceptance Scenarios**:

1. **Given** I am on the marketplace page, **When** I click "Invest Now" on a property, **Then** I am redirected to the detailed property page
2. **Given** I am on the property detail page, **When** I enter a valid investment amount and confirm, **Then** my wallet prompts for approval and investment is processed
3. **Given** I have invested successfully, **When** I check my portfolio, **Then** I can see my shares and pending rewards

---

### User Story 2 - Secondary Market Trading (Priority: P2)

As an investor, I want to sell my shares through the internal order book so that I can exit my investment before maturity if needed.

**Why this priority**: Provides liquidity and investor flexibility, critical for adoption

**Independent Test**: Can be fully tested by creating a sell order, matching it with a buy order, and verifying share transfer. Delivers complete secondary market functionality.

**Acceptance Scenarios**:

1. **Given** I own shares, **When** I create a sell order at a specific price, **Then** the order appears in the order book
2. **Given** There is an active sell order, **When** I buy shares as another investor, **Then** the order is filled and shares are transferred
3. **Given** I created a sell order, **When** I cancel it before it's filled, **Then** my shares are returned to my wallet

---

### User Story 3 - Reward Management (Priority: P2)

As an investor, I want to claim my earned interest and principal repayments so that I can receive returns on my investment.

**Why this priority**: Essential for investor experience and platform utility

**Independent Test**: Can be fully tested by triggering distributions and claiming rewards. Delivers complete reward lifecycle.

**Acceptance Scenarios**:

1. **Given** the issuer has distributed interest payments, **When** I check my pending rewards, **Then** I can see the correct amount
2. **Given** I have pending rewards, **When** I click "Claim Rewards", **Then** the tokens are transferred to my wallet
3. **Given** I have claimed rewards, **When** I check my transaction history, **Then** the claim is recorded correctly

---

### User Story 4 - Admin Dashboard (Priority: P3)

As an admin, I want to manage mortgage contracts and distributions so that I can operate the platform efficiently.

**Why this priority**: Important for platform operations but not investor-facing

**Independent Test**: Can be fully tested by deploying contracts, managing stages, and processing distributions. Delivers complete admin functionality.

**Acceptance Scenarios**:

1. **Given** I am an admin, **When** I deploy a new mortgage contract, **Then** it appears correctly configured
2. **Given** a funding period is complete, **When** I withdraw principal, **Then** funds are transferred to issuer wallet
3. **Given** I have collected payments, **When** I distribute interest or principal, **Then** all investors receive their pro-rata shares

---

### Edge Cases

- What happens when a user tries to invest more than the remaining funding cap?
- How does system handle failed transactions or insufficient gas?
- What happens when a user tries to claim rewards multiple times?
- How does system handle concurrent sell orders for the same shares?
- What happens if the issuer fails to make scheduled payments?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to invest in mortgage properties starting from 1 USDT
- **FR-002**: System MUST implement tiered investment limits (1 USDT min, $10K max per investor)  
- **FR-003**: System MUST provide internal order book with external exit options for secondary trading
- **FR-004**: System MUST implement geographic restrictions with KYC requirements
- **FR-005**: System MUST use hybrid on-chain/off-chain data storage with IPFS for documents
- **FR-006**: System MUST display real-time funding progress and investor statistics
- **FR-007**: System MUST support wallet connection via MetaMask and popular providers
- **FR-008**: System MUST process reward claims with double-payment prevention
- **FR-009**: System MUST emit events for all major operations (invest, transfer, claim, distribute)
- **FR-010**: System MUST maintain audit trail for all transactions and state changes

### Key Entities

- **MortgageProject**: Represents a single property investment opportunity with property details, loan terms, and risk metrics
- **Investment**: Represents user's share ownership in a specific mortgage project
- **SellOrder**: Represents a user's offer to sell shares at a specific price in the secondary market
- **RewardDistribution**: Tracks accumulated interest and principal repayments for each investor
- **UserAccount**: Contains user profile, KYC status, and investment history

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete property investment in under 3 minutes from wallet connection to confirmation
- **SC-002**: System handles 100 concurrent investors without performance degradation
- **SC-003**: 95% of users successfully complete investment on first attempt
- **SC-004**: Secondary market transactions settle within 2 minutes of order matching
- **SC-005**: Reward distributions process automatically with zero manual calculation errors
- **SC-006**: Platform achieves 99.9% uptime during funding periods
- **SC-007**: Smart contract gas costs remain under target thresholds for all operations

## Clarifications

### Session 2025-12-09

- Q: Project Scope and Deployment Strategy → A: Single Property MVP with Multi-Property Foundation
- Q: Investment Minimum and Maximum Limits → B: Tiered Minimums with Caps (1 USDT min, $10K max per investor)
- Q: Secondary Market Trading Strategy → B: Internal P2P Matching with escrow logic in smart contract
- Q: Regulatory Compliance Approach → A: Geographic Restrictions with KYC
- Q: Data Storage and Privacy Strategy → C: Hybrid On-Chain/Off-Chain with IPFS

## Technical Notes

### Blockchain Data (On-Chain)
- Funding cap and total raised amounts
- Share ownership and transfers
- Accrued interest and principal per share
- Investment and claim transactions
- Order book states and matching

### Off-Chain Data (JSON/IPFS)
- Property details and images
- Loan terms and risk metrics
- Document references and files
- User KYC and geographic data
- Historical performance data

### Smart Contract Integration
- Contract address: 0x5F5d42A41E678701a241b5bb1944CF3919346445
- Payment token: 0x19b4D862Df0b30691D61674847657c34a60cFEE8
- Foundry for testing and deployment
- Viem for frontend blockchain interactions