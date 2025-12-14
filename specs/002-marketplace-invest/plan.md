# Implementation Plan: Marketplace Investment Flow

**Branch**: `002-marketplace-invest` | **Date**: 2025-12-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-marketplace-invest/spec.md`

## Summary

This feature implements a complete marketplace investment flow allowing users to browse mortgage projects from JSON data, navigate to detailed property pages, submit investments through wallet integration, and view updated portfolios immediately after successful transactions. The implementation leverages existing Next.js infrastructure, Viem wallet integration, and the deployed MortgageBond smart contract.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)

**Primary Dependencies**: 
- Next.js 14 (React Server Components + App Router)
- Viem + Wagmi (Web3 wallet integration)
- TailwindCSS + shadcn/ui (UI components)
- React Hook Form (form validation)

**Storage**: 
- Static JSON file for project data (`frontend/data/projects.json`)
- On-chain data via smart contract reads (MortgageBond)
- No backend database required

**Testing**: 
- Component testing with React Testing Library
- Integration testing for investment flow
- Smart contract interaction testing

**Target Platform**: Web (Desktop + Mobile responsive)

**Project Type**: Web application (Next.js frontend + smart contract backend)

**Performance Goals**: 
- Marketplace page load < 2 seconds
- Property detail page load < 1 second
- Investment transaction submission < 30 seconds (including wallet confirmation)
- Portfolio update within 5 seconds post-transaction

**Constraints**: 
- Minimum investment: 1 USDT
- No maximum except funding cap
- Must maintain responsive design (mobile-first)
- Real-time portfolio synchronization required

**Scale/Scope**: 
- Support 50+ concurrent users browsing marketplace
- Handle 10-20 simultaneous property listings
- Portfolio updates for multiple concurrent investments

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Simplicity**: Feature uses existing infrastructure (Next.js routing, wallet integration, UI components)
✅ **Minimal Dependencies**: Leverages already-installed packages (Wagmi, Viem, shadcn/ui)
✅ **Clear Ownership**: All components are self-contained within the feature scope
✅ **No Over-Engineering**: Direct implementation without unnecessary abstractions

## Project Structure

### Documentation (this feature)

```text
specs/002-marketplace-invest/
├── plan.md              # This file
├── spec.md              # Feature specification (completed)
├── checklists/
│   └── requirements.md  # Specification quality checklist (completed)
└── tasks.md             # Task breakdown (to be created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── marketplace/
│   │   └── page.tsx                    # [MODIFY] Add JSON data loading
│   ├── mortgage/
│   │   └── [id]/
│   │       └── page.tsx                # [CREATE] Property detail page
│   └── page.tsx                        # [EXISTS] Home with portfolio
│
├── components/
│   ├── marketplace-content.tsx         # [MODIFY] Update to use JSON data
│   ├── property-card.tsx               # [MODIFY] Add navigation to detail page
│   ├── property-detail.tsx             # [CREATE] Full property details display
│   ├── investment-form.tsx             # [CREATE] Investment amount input + validation
│   ├── dashboard-content.tsx           # [MODIFY] Add real-time portfolio sync
│   └── ui/
│       ├── skeleton.tsx                # [CREATE] Loading skeleton component
│       └── error-message.tsx           # [CREATE] Error display component
│
├── hooks/
│   ├── useMortgageBond.ts             # [EXISTS] Smart contract interactions
│   ├── useInvestment.ts               # [CREATE] Investment transaction logic
│   ├── usePortfolio.ts                # [CREATE] Portfolio data management
│   └── useProjects.ts                 # [CREATE] JSON project data loading
│
├── lib/
│   ├── contracts.ts                   # [EXISTS] Contract ABIs and addresses
│   ├── validation.ts                  # [CREATE] Investment amount validation
│   └── utils.ts                       # [EXISTS] Utility functions
│
├── data/
│   └── projects.json                  # [CREATE] Mortgage project data
│
└── types/
    └── project.ts                     # [CREATE] TypeScript interfaces
```

**Structure Decision**: Web application structure using Next.js App Router. The feature extends existing pages (`/marketplace`, `/`) and creates a new dynamic route (`/mortgage/[id]`). All components follow the established pattern of client components with server-side data loading where applicable.

## Implementation Phases

### Phase 0: Data Model & JSON Structure

**Goal**: Define the project data structure and create sample JSON file

**Deliverables**:
1. TypeScript interface for `MortgageProject` type
2. JSON schema with minimal fields (name, image, funding info)
3. Sample `projects.json` with 3-5 projects

**Key Decisions**:
- JSON structure: `{ projects: [{ id, name, image, fundingCap, raised, ... }] }`
- Image paths stored as strings (public folder references)
- Funding information matches smart contract data format

### Phase 1: Marketplace Page Enhancement

**Goal**: Load projects from JSON and display with navigation

**Tasks**:
1. Create `useProjects` hook to load JSON data
2. Update `marketplace-content.tsx` to use hook instead of hardcoded data
3. Modify `property-card.tsx` to include `Link` to `/mortgage/[id]`
4. Add skeleton loading state while JSON loads
5. Add error handling for JSON load failures

**Testing**:
- Verify all projects from JSON display correctly
- Test navigation from card to detail page
- Validate loading states appear during data fetch
- Confirm error messages display when JSON fails

### Phase 2: Property Detail Page

**Goal**: Create comprehensive property detail page with all project information

**Tasks**:
1. Create `/app/mortgage/[id]/page.tsx` dynamic route
2. Build `property-detail.tsx` component with full property info
3. Fetch project data by ID from JSON
4. Display property images, funding progress, terms, risk metrics
5. Add responsive layout for mobile/desktop
6. Include skeleton loader for page load state

**Testing**:
- Navigate from marketplace to detail page
- Verify correct project loads by ID
- Test 404 handling for invalid IDs
- Validate responsive design on mobile

### Phase 3: Investment Form Component

**Goal**: Create investment input with validation and wallet integration

**Tasks**:
1. Build `investment-form.tsx` component
2. Implement `useInvestment` hook for transaction logic
3. Add form validation (minimum 1 USDT, max = remaining funding)
4. Integrate with `useMortgageBond` for contract calls
5. Display user-friendly error messages
6. Add transaction pending states
7. Handle wallet connection errors

**Validation Rules**:
- Minimum: 1 USDT
- Maximum: `fundingCap - totalRaised`
- No negative or zero values
- User has sufficient wallet balance

**Testing**:
- Test validation with various amounts (valid, too low, too high)
- Verify wallet prompts appear on submit
- Test error handling for insufficient funds
- Validate transaction pending states

### Phase 4: Investment Transaction Flow

**Goal**: Process investment and redirect to portfolio

**Tasks**:
1. Wire up investment form to smart contract `invest()` function
2. Add transaction confirmation handling
3. Implement redirect to home page after success
4. Add transaction error handling with retry option
5. Display success/error toasts

**Error Scenarios**:
- Wallet connection failure → "Unable to connect to wallet"
- Insufficient funds → "Insufficient wallet balance"
- Transaction rejected → "Transaction cancelled"
- Network error → "Network error. Please retry"
- Funding cap exceeded → "Investment exceeds remaining capacity"

**Testing**:
- Complete successful investment flow
- Test all error scenarios
- Verify redirect happens after confirmation
- Validate error messages are user-friendly

### Phase 5: Real-Time Portfolio Update

**Goal**: Update portfolio immediately after investment confirmation

**Tasks**:
1. Create `usePortfolio` hook for portfolio data management
2. Update `dashboard-content.tsx` to use real-time data
3. Implement contract event listening for investment confirmations
4. Add portfolio refetch after transaction success
5. Display updated investment in portfolio list
6. Add loading state during portfolio refresh

**Testing**:
- Make investment and verify portfolio updates
- Test portfolio persistence on page refresh
- Validate loading states during updates
- Confirm correct amounts display

### Phase 6: Loading States & Error Handling

**Goal**: Implement skeleton screens and comprehensive error handling

**Tasks**:
1. Create reusable `Skeleton` component with shimmer effect
2. Build `ErrorMessage` component with recovery actions
3. Add skeleton loaders to:
   - Marketplace grid during JSON load
   - Property detail page during data fetch
   - Investment form during transaction
   - Portfolio during refresh
4. Implement error boundaries for component crashes
5. Add retry buttons for failed operations

**Testing**:
- Verify skeleton screens appear during all loading states
- Test error messages for all failure scenarios
- Validate retry functionality works
- Confirm error boundaries catch component errors

### Phase 7: Edge Cases & Polish

**Goal**: Handle all edge cases and final refinements

**Edge Cases to Handle**:
1. Investment exceeds remaining funding → Auto-adjust to max available
2. Invalid investment amount → Clear input and show error
3. JSON load failure → Retry button with error message
4. Corrupted JSON data → Support contact message
5. Wallet connection lost during investment → Reconnect prompt
6. Network interruption → Transaction status check
7. Project fully funded while viewing → Disable invest button

**Polish Items**:
- Add smooth transitions between pages
- Improve mobile touch targets
- Optimize image loading with Next.js Image
- Add accessibility attributes (ARIA labels)
- Ensure keyboard navigation works

**Testing**:
- Test each edge case scenario
- Verify user-friendly messages for all cases
- Test accessibility with screen reader
- Validate keyboard navigation

## Dependencies & Integration Points

### Existing Code to Leverage

1. **Smart Contract Integration**:
   - `useMortgageBond` hook for contract reads
   - `CONTRACTS` configuration with ABIs
   - Wagmi hooks for wallet interaction

2. **UI Components**:
   - shadcn/ui Card, Button, Input components
   - Existing layout components (DashboardLayout)
   - Progress bar component for funding display

3. **Utility Functions**:
   - Number formatting utilities
   - Toast notification system
   - Media query hook for responsive design

### New Dependencies Required

None - all functionality can be implemented with existing dependencies.

### Smart Contract Functions Used

```solidity
// Read Functions
- FUNDING_CAP() → uint256
- totalPrincipalRaised() → uint256
- isFundingActive() → bool
- investors(address) → (shares, interestDebt, principalDebt)

// Write Functions
- invest(uint256 amount) → triggers Invested event
```

## Data Flow

### Marketplace Browsing Flow
```
JSON File → useProjects hook → MarketplaceContent → PropertyCard → User sees cards
```

### Investment Flow
```
User Input → InvestmentForm validation → useInvestment hook → 
Wallet approval → MortgageBond.invest() → Transaction confirmed → 
Event emitted → Portfolio refetch → Updated portfolio displayed
```

### Portfolio Update Flow
```
Investment confirmed → usePortfolio hook listens for event → 
Refetch contract data → Update UI state → Display new investment
```

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| JSON file not found | High | Graceful error with retry, fallback to empty state |
| Wallet connection fails | High | Clear error message with troubleshooting steps |
| Transaction reverts | Medium | Parse revert reason, display user-friendly message |
| Concurrent investments hit cap | Medium | Real-time validation before transaction |
| Network latency | Low | Show loading states, allow cancellation |
| Image load failures | Low | Fallback placeholder images |

## Success Metrics Alignment

Mapping implementation to success criteria from spec:

- **SC-001** (Browse < 2s): Optimize JSON loading, use static data
- **SC-002** (95% nav success): Robust routing, error boundaries
- **SC-003** (Invest < 3min): Streamlined form, clear guidance
- **SC-004** (90% tx success): Thorough validation, helpful errors
- **SC-005** (Portfolio < 5s): Event-driven updates, efficient refetch
- **SC-006** (50 concurrent users): Static JSON, client-side rendering
- **SC-007** (Error clarity): Comprehensive error component with recovery

## Next Steps

1. Review and approve this implementation plan
2. Run `/speckit.tasks` to generate task breakdown
3. Begin Phase 0 (Data Model & JSON Structure)
4. Implement phases sequentially with testing at each stage
5. Conduct final integration testing across all user stories

## Complexity Tracking

> No complexity violations - feature adheres to constitution principles of simplicity and minimal dependencies.
