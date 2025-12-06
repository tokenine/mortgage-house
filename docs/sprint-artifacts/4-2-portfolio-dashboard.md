# Story 4.2: Create Investor Portfolio Dashboard

**Status:** ready-for-dev
**Epic:** 4 - Investor Portfolio & Withdrawal Management
**Created:** 2025-12-06
**Author:** Dev Agent

---

## 🎯 Story Foundation

As an investor,
I want to view a comprehensive portfolio dashboard showing my investments, earnings, and withdrawal options,
so that I can track my mortgage investment performance and manage my withdrawals efficiently.

## ✅ Acceptance Criteria

### AC1: Portfolio Overview Display
**Given** I have invested in mortgage contracts
**When** I visit my portfolio dashboard
**Then** I see all my active investments in a clear, organized layout
**And** each investment shows: contract address, property value, loan amount, interest rate, loan term, and my share percentage
**And** the dashboard displays my total invested amount across all contracts
**And** my portfolio value updates in real-time as investments change

### AC2: Earnings and Withdrawal Tracking
**Given** I have earned principal and interest from my investments
**When** I view my portfolio dashboard
**Then** I see separate sections for entitled principal and interest earnings
**And** the dashboard shows withdrawable amounts vs total entitled amounts
**And** I can view my earnings history with timestamps and transaction details
**And** the interface clearly indicates when funds are available for withdrawal

### AC3: Real-time Data Updates
**Given** the mortgage contract receives new repayments or I make withdrawals
**When** I am viewing my portfolio dashboard
**Then** all displayed values update automatically within 3 seconds
**And** new earnings appear with visual indicators (animations or highlights)
**And** withdrawal availability updates in real-time
**And** error states are handled gracefully with user-friendly messages

### AC4: Interactive Withdrawal Interface
**Given** I have withdrawable funds available
**When** I access the withdrawal section of my dashboard
**Then** I can select which funds to withdraw (principal, interest, or both)
**And** the interface shows gas costs and transaction fees before confirmation
**And** withdrawal amounts are validated against available balances
**And** I can confirm transactions with clear success/error feedback

### AC5: Mobile Responsive Design
**Given** I access my portfolio dashboard on any device
**When** I view the dashboard
**Then** the layout adapts seamlessly to mobile, tablet, and desktop screens
**And** all interactive elements remain accessible and functional
**And** data visualizations scale appropriately for different screen sizes
**And** loading states and error displays work consistently across devices

---

## 🏗️ Developer Context Section

### 🔴 CRITICAL: Do Not Violate These Constraints

**FRONTEND DEVELOPMENT:**
- MUST use Nuxt 3 composables pattern established in Epic 2 [Source: 2-1-nuxt-web3-setup.md]
- MUST integrate with useMortgageContract composable from Epic 4.1 [Source: 4-1-pro-rata-distribution.md]
- MUST use structured error handling system [Source: 2-3-structured-error-handling.md]
- MUST follow established reactive state patterns with Vue 3 [Source: 2-1-nuxt-web3-setup.md]
- MUST use Tailwind CSS for consistent styling with existing components

**VISUAL DESIGN:**
- MUST maintain design consistency with existing funding and investment components
- MUST use established color scheme and typography from Epic 2 components
- MUST implement responsive design using Tailwind CSS breakpoints
- MUST ensure accessibility compliance (WCAG 2.1 AA minimum)

### 📊 Technical Requirements

**Frontend Components to Implement:**

```vue
<!-- Main portfolio dashboard component -->
<PortfolioDashboard>
  <PortfolioOverview :investments="investments" :totalValue="totalInvested" />
  <EarningsSection :principal="entitledPrincipal" :interest="entitledInterest" />
  <WithdrawalInterface @withdraw="handleWithdrawal" />
  <TransactionHistory :transactions="transactions" />
</PortfolioDashboard>

<!-- Individual portfolio components -->
<InvestmentCard :investment="investment" @details="showDetails" />
<EarningsChart :data="earningsData" type="principal|interest" />
<WithdrawalForm :availableAmounts="withdrawableAmounts" />
<EarningsTimeline :events="earningsEvents" />
```

**Composable Integration:**
```typescript
// Extend existing useMortgageContract composable
const portfolio = computed(() => {
  return {
    investments: allInvestments.value,
    totalInvested: totalInvestedAcrossContracts.value,
    totalEarnings: {
      principal: entitledPrincipalAcrossContracts.value,
      interest: entitledInterestAcrossContracts.value
    },
    withdrawable: {
      principal: withdrawablePrincipalAcrossContracts.value,
      interest: withdrawableInterestAcrossContracts.value
    }
  }
})

// Real-time event listeners for portfolio updates
const setupPortfolioListeners = () => {
  // Listen for PrincipalDeposited, InterestDeposited, PayoutWithdrawn events
  // Update portfolio state in real-time
}
```

**Data Management Requirements:**
- Real-time state synchronization with contract events
- Efficient data fetching and caching strategies
- Loading states for all async operations
- Error boundary implementation for graceful failure handling

### 🎨 Architecture Compliance

**File Structure Requirements:**
```
/frontend/components/portfolio/ (new directory)
  - PortfolioDashboard.vue (main container)
  - PortfolioOverview.vue (investment summary)
  - EarningsSection.vue (earnings display)
  - WithdrawalInterface.vue (withdrawal controls)
  - TransactionHistory.vue (historical data)
  - InvestmentCard.vue (individual investment display)
  - EarningsChart.vue (data visualization)
  - EarningsTimeline.vue (timeline view)

/frontend/composables/ (extend existing)
  - usePortfolio.ts (new portfolio-specific composable)
  - useMortgageContract.ts (extend with portfolio features)

/frontend/pages/portfolio/ (new directory)
  - index.vue (main portfolio page)
  - [id].vue (individual investment details)

/frontend/utils/portfolio/ (new directory)
  - portfolioCalculations.ts (investment calculations)
  - formatters.ts (data formatting utilities)
```

**State Management Pattern:**
- Use Vue 3 Composition API with reactive refs
- Leverage existing error handling patterns from Epic 2
- Implement efficient event-driven updates using contract events
- Cache data appropriately to minimize unnecessary re-renders

**Component Naming Conventions:**
- Components: PascalCase with descriptive names (`PortfolioDashboard`, `EarningsSection`)
- Composables: camelCase starting with `use` (`usePortfolio`, `useEarnings`)
- Utilities: camelCase with domain context (`formatPortfolioAmount`, `calculateEarnings`)

### 📚 Library & Framework Requirements

**Frontend Libraries:**
- Nuxt 3 (already established from Epic 2) [Source: 2-1-nuxt-web3-setup.md]
- Vue 3 Composition API (already established)
- Tailwind CSS for styling (already integrated)
- Chart.js or recharts for data visualization
- VueUse for additional composition utilities

**Data Visualization:**
- Responsive chart components for earnings visualization
- Timeline components for transaction history
- Progress indicators for investment status
- Real-time updating data displays

**Testing Requirements:**
- Vitest testing framework (already established from Epic 2) [Source: 2-3-structured-error-handling.md]
- Component testing with Vue Test Utils
- Integration testing for composable functionality
- E2E testing for critical user flows
- Responsive design testing across devices

### 🧪 Testing Requirements

**Frontend Tests Must Include:**
1. **Component Functionality**
   - Portfolio dashboard renders correctly with sample data
   - Real-time updates trigger proper state changes
   - Withdrawal interface validates amounts correctly
   - Error handling displays user-friendly messages

2. **Data Integration**
   - useMortgageContract composable integration works properly
   - Real-time event listeners update portfolio state
   - Data formatting displays correctly across all components
   - Loading states work during async operations

3. **User Interaction**
   - Withdrawal forms validate input properly
   - Transaction confirmations work as expected
   - Mobile navigation and interactions function correctly
   - Accessibility features work with screen readers

4. **Performance**
   - Dashboard loads within 3 seconds with data
   - Real-time updates complete within 500ms
   - Mobile performance meets <3s interaction time
   - Memory usage remains stable during extended use

### 🔍 Previous Story Intelligence

**Epic 4.1 Learnings (Pro-rata Distribution):**
- Distribution calculations provide real-time withdrawable amounts [Source: 4-1-pro-rata-distribution.md]
- Event system enables instant portfolio updates
- Structured error handling pattern ready for portfolio implementation
- Gas optimization techniques available for withdrawal operations

**Epic 3 Learnings (Investment Flow):**
- Real-time state synchronization implemented and tested [Source: 3-2-funding-progress.md]
- Component patterns for financial data display established
- Transaction feed patterns can be adapted for portfolio history
- Performance optimization for real-time updates proven

**Epic 2 Learnings (Web3 Integration):**
- useMortgageContract composable provides solid foundation for portfolio data [Source: 2-2-mortgage-contract-composable.md]
- Error handling system ready for portfolio-specific errors [Source: 2-3-structured-error-handling.md]
- Wallet integration patterns established for user interactions [Source: 2-1-nuxt-web3-setup.md]
- Responsive design patterns proven with existing components

### 📋 Git Intelligence Summary

**Recent Commit Patterns:**
- Vue 3 Composition API with reactive state management
- Component-based architecture with proper separation of concerns
- Tailwind CSS for responsive and consistent styling
- Comprehensive error handling with user-friendly messages
- Real-time updates using contract event listeners

**File Creation Patterns:**
- Components organized by feature domain directories
- Composables provide reusable business logic
- Utility functions for common calculations and formatting
- Test files mirror component structure for maintainability

### 🌐 Latest Technical Information

**Vue 3 + Nuxt 3 Requirements:**
- Use `<script setup>` syntax for composables
- Leverage auto-imports for composables and utilities
- Implement proper TypeScript typing for all components
- Use VueUse for additional composition utilities

**Tailwind CSS Integration:**
- Follow established design system with consistent spacing and colors
- Use responsive prefixes for mobile-first design
- Implement dark mode support if needed
- Ensure accessibility with proper focus states and contrast ratios

**Data Visualization Best Practices:**
- Choose appropriate chart types for financial data (line charts for trends, bar charts for comparisons)
- Implement responsive charts that scale appropriately
- Add interactive elements (tooltips, legends) for better UX
- Ensure accessibility with proper labeling and keyboard navigation

### 📖 Project Context Reference

**Architecture Alignment:**
- **Frontend Architecture**: Extend established Nuxt 3 patterns from Epic 2 [Source: docs/architecture.md#Frontend Architecture]
- **Data Flow**: Use established event-driven state management from Epic 3
- **Component Library**: Build on existing component patterns and design system
- **Performance**: Maintain <3s interaction times and real-time update requirements

**Epic Integration:**
- **Prerequisite**: Depends on Epic 4.1 (Pro-rata Distribution) for withdrawable amount calculations
- **Foundation**: Enables Epic 4.3 (Withdrawal Processing) with portfolio management interface
- **Supports**: Epic 4.4 (Transaction Tracking) with portfolio-centered transaction history
- **Critical for**: User investment management and portfolio visibility

**Business Value:**
- **User Trust**: Transparent portfolio visibility enhances platform trust
- **User Engagement**: Real-time portfolio updates increase user engagement
- **Financial Literacy**: Clear earnings and withdrawal information supports investment decisions
- **Platform Retention**: Comprehensive portfolio management drives user retention

**Accessibility Requirements:**
- **WCAG 2.1 AA**: Full compliance for accessibility standards
- **Screen Reader Support**: Proper labeling for financial data
- **Keyboard Navigation**: Complete keyboard accessibility for all interactions
- **Color Contrast**: Minimum 4.5:1 contrast ratio for text readability

### 🔗 References

- [Architecture: Frontend Requirements](docs/architecture.md#Frontend Architecture)
- [Epic 2: Web3 Integration Foundation](2-1-nuxt-web3-setup.md)
- [Epic 3: Real-time Investment Flow](3-2-funding-progress.md)
- [Epic 4.1: Pro-rata Distribution](4-1-pro-rata-distribution.md)
- [Epic 4 Details: Portfolio Management](docs/epics.md#Epic-4-Investor-Portfolio-and-Withdrawal-Management)

---

## 🎯 Dev Agent Execution Instructions

### Step 1: Create Portfolio Composable
1. **Create usePortfolio composable** that extends useMortgageContract
2. **Implement portfolio state management** with reactive refs
3. **Add real-time event listeners** for contract distribution events
4. **Create calculation utilities** for portfolio totals and performance metrics

### Step 2: Build Portfolio Components
1. **Create main PortfolioDashboard component** with responsive layout
2. **Build PortfolioOverview component** for investment summary display
3. **Implement EarningsSection component** for principal/interest tracking
4. **Create WithdrawalInterface component** with form validation
5. **Add TransactionHistory component** for earnings timeline

### Step 3: Data Visualization
1. **Implement EarningsChart component** for visual earnings display
2. **Create progress indicators** for investment status
3. **Add real-time update animations** for new earnings
4. **Implement responsive data tables** for detailed views

### Step 4: Page Integration
1. **Create portfolio page routes** (/portfolio and /portfolio/[id])
2. **Integrate with existing navigation** and layout
3. **Add proper loading states** and error boundaries
4. **Implement mobile-responsive design** with Tailwind CSS

### Step 5: Testing & Optimization
1. **Unit test all components** with proper mocking
2. **Integration test composable functionality**
3. **E2E test critical user flows**
4. **Performance testing and optimization**

### ✅ Success Criteria
- [ ] Portfolio dashboard displays all user investments correctly
- [ ] Real-time earnings updates work within 3 seconds
- [ ] Withdrawal interface validates and processes transactions properly
- [ ] Mobile responsive design works across all device sizes
- [ ] Accessibility compliance achieved (WCAG 2.1 AA)
- [ ] Comprehensive test coverage achieved (>90%)
- [ ] Performance targets met (<3s load time, <500ms updates)

---

## 🚨 Critical Warning: Do Not Skip These Requirements

1. **MUST integrate with useMortgageContract composable** from Epic 4.1
2. **MUST use established error handling patterns** from Epic 2
3. **MUST maintain real-time update requirements** from Epic 3
4. **MUST achieve mobile responsiveness** with Tailwind CSS
5. **MUST implement accessibility compliance** (WCAG 2.1 AA)
6. **MUST follow Vue 3 Composition API patterns** consistently
7. **MUST include comprehensive testing** for all components

---

## Dev Agent Record

### Context Reference
<!-- Implementation context will be tracked here -->

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20251101)

### Debug Log References

### Completion Notes List
- Portfolio dashboard story created with comprehensive developer context
- Integration points with existing epics clearly defined
- Technical specifications aligned with established patterns

### File List (Expected)
- `/frontend/composables/usePortfolio.ts` (new)
- `/frontend/components/portfolio/PortfolioDashboard.vue` (new)
- `/frontend/components/portfolio/PortfolioOverview.vue` (new)
- `/frontend/components/portfolio/EarningsSection.vue` (new)
- `/frontend/components/portfolio/WithdrawalInterface.vue` (new)
- `/frontend/components/portfolio/TransactionHistory.vue` (new)
- `/frontend/pages/portfolio/index.vue` (new)
- Test files and documentation

**Status:** ready-for-dev