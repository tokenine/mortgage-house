# Feature Specification: Claim Bond Yield Button

**Feature Branch**: `[004-claim-bond-yield]`  
**Created**: 2025-12-15  
**Status**: Draft  
**Input**: User description: "Create a claim button beside the sell button in dashboard-content bond cards. The claim button triggers claiming yield for that specific bond to the user's wallet, using real on-chain transactions per constitution Principle VII. Prioritize independent, testable user story and success criteria."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Claim yield from a specific bond (Priority: P1)

As an investor viewing my bond cards on the dashboard, I can click a Claim button on a specific bond card to claim only that bond’s accrued yield to my wallet, with clear transaction status feedback.

**Why this priority**: Enables core investor value — realizing yield — and validates real blockchain integration on a focused, independently testable slice.

**Independent Test**: Can be fully tested by funding yield on-chain for a single project, then clicking Claim on its card and verifying wallet balance increases and UI shows success.

**Acceptance Scenarios**:

1. Given I have an investment with unclaimed yield, When I click Claim on that bond card, Then a transaction is submitted and I see pending → confirming → success with my wallet balance increased by the claimed yield.
2. Given I have no unclaimed yield for a bond, When I click Claim on that bond card, Then the button is disabled and I see a tooltip or hint explaining why.

---

### User Story 2 - Error handling and resilience (Priority: P2)

As an investor, if a claim transaction fails or is rejected, I receive a clear error message and can retry safely without inconsistent UI state.

**Why this priority**: Improves trust and usability for real blockchain interactions where failures can occur.

**Independent Test**: Simulate a revert or user rejection and verify error toast, disabled state cleared, and the card remains consistent with on-chain state.

**Acceptance Scenarios**:

1. Given a failed transaction (revert), When I click Claim, Then I see a descriptive error toast and the card remains unchanged.
2. Given I cancel in wallet, When I click Claim, Then I see a cancellation notice and can retry.

---

### User Story 3 - Portfolio refresh after claim (Priority: P3)

As an investor, after a successful claim, the specific bond’s yield and the portfolio totals update automatically without needing a manual refresh.

**Why this priority**: Keeps data consistent and reduces confusion post-transaction.

**Independent Test**: After success, verify the bond’s yield becomes zero (or reduced by the claimed amount) and totals reflect the new state without manual reload.

**Acceptance Scenarios**:

1. Given a successful claim, When confirmation is received, Then the bond card’s yield and portfolio totals update automatically.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Bond has zero or dust-level yield: Claim must be disabled and explain why.
- Multiple claims in rapid succession: Prevent duplicate submissions while one is pending.
- Network switched mid-operation: Show a prompt and prevent mismatched chain execution.
- Wallet disconnected: Hide/disable Claim and prompt to connect.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST render a Claim button on each bond card in `dashboard-content` alongside the Sell button, scoped to that bond.
- **FR-002**: System MUST determine claimability per bond (e.g., yield > 0, correct network, connected wallet) and enable/disable the button accordingly with user-friendly hints.
- **FR-003**: System MUST initiate a real on-chain transaction to claim yield for the specific bond using wallet provider flow and show status feedback (pending, confirming, success, error).
- **FR-004**: System MUST update only the affected bond and portfolio totals after a successful claim without a full page reload.
- **FR-005**: System MUST surface clear error messaging for reverts, user rejections, and network mismatches, with safe retry.
- **FR-006**: System MUST log and emit UI events consistent with Transparency & Auditability (event-driven updates, no hidden state) without exposing implementation details to users.
- **FR-007**: System MUST adhere to Real Blockchain Integration: use real reads/writes and confirmation handling; console logs/alerts are not substitutes for transaction/UI feedback.

### Key Entities *(include if feature involves data)*

- **Bond Investment**: Represents a user’s position in a property/project; attributes: `projectId`, `shares`, `currentValue`, `yield`, `apy`, `image`, `name`.
- **Claim Transaction**: Represents the action to move accrued yield to the user’s wallet; attributes: `txHash`, `status` (pending, confirming, success, error), `amount`, `projectId`.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Investors can claim yield from a single bond card end-to-end in under 2 minutes including wallet confirmation.
- **SC-002**: 95% of claim attempts provide clear status feedback without UI ambiguity (pending, confirming, success, error).
- **SC-003**: Post-claim portfolio data reflects on-chain state within 5 seconds for 90% of successful claims.
- **SC-004**: Error scenarios (revert or user rejection) produce actionable messages with retry available in 100% of cases.

## Assumptions

- Claim function exists on the bond’s mortgage contract and is invokable without additional parameters when scoped by `projectId` or contract address.
- Yield displayed per bond card corresponds to claimable on-chain amount.
- Standard wallet connection and chain selection already available in the app.

## Clarifications

### Session 2025-12-15

- Q: How is claim routing handled across projects? → A: Per-project contract address

Resolved: Each bond card invokes its project-specific contract’s `claimRewards` using that project’s address. No shared router or backend proxy is involved.
