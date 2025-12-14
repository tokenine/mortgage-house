# Feature Specification: Unified Marketplace Order Modal

**Feature Branch**: `001-marketplace-order-modal`  
**Created**: December 14, 2025  
**Status**: Draft  
**Input**: User description: "create spec to update this feature. make sell modal can create order buy order and sell order to this component on marketplace page completedly clone on functionality /Users/poom-work/tokenine/mortage-house/frontend/components/marketplace-content.tsx"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Sell Order from Marketplace (Priority: P1)

An investor who owns bond shares wants to list them for sale on the secondary marketplace. They click a button on the marketplace page, enter the number of shares and asking price, and submit the listing. The system validates their share ownership and creates the sell order.

**Why this priority**: This is the primary entry point for liquidity in the secondary market. Without the ability to create sell orders, the marketplace cannot function. This delivers immediate value as a standalone feature.

**Independent Test**: Can be fully tested by connecting a wallet with bond shares, clicking "Create Sell Order", filling out the form, and verifying the order appears in the active orders list. Delivers value by enabling sellers to list their shares.

**Acceptance Scenarios**:

1. **Given** I am on the marketplace page and own 100 bond shares, **When** I click "Create Sell Order" button in the Secondary Market section, **Then** a modal opens with a form to enter share quantity and price
2. **Given** the sell order modal is open, **When** I enter 50 shares at 105 USDT total price and submit, **Then** the order is created and appears in the Active Sell Orders list
3. **Given** the sell order modal is open, **When** I enter 150 shares (more than I own), **Then** I see an error message "You only have 100 shares available"
4. **Given** I successfully create a sell order, **When** the transaction confirms, **Then** the modal closes automatically and shows a success notification
5. **Given** the sell order modal is open, **When** I enter fractional shares like 50.5, **Then** I see an error message "Shares must be whole numbers"

---

### User Story 2 - Create Buy Order from Marketplace (Priority: P2)

An investor wants to purchase bond shares from another investor at a specific price point. They click a button to create a buy order, specify how many shares they want to buy and at what price, and submit. The system validates they have sufficient USDT and creates the buy order for sellers to fill.

**Why this priority**: Complements the sell order functionality by enabling price discovery and limit orders. This is P2 because the marketplace can function with immediate buy execution (existing functionality), but buy orders enhance liquidity and user flexibility.

**Independent Test**: Can be fully tested by connecting a wallet with USDT, clicking "Create Buy Order", filling out the form with desired share quantity and price, and verifying the order is created. Delivers value by letting buyers set their desired price points.

**Acceptance Scenarios**:

1. **Given** I am on the marketplace page with sufficient USDT, **When** I click "Create Buy Order" button in the Secondary Market section, **Then** a modal opens with a form to enter desired share quantity and price
2. **Given** the buy order modal is open, **When** I enter 100 shares at 95 USDT total price and submit, **Then** the order is created and appears in the Active Buy Orders list
3. **Given** the buy order modal is open, **When** I enter a price exceeding my USDT balance, **Then** I see an error message indicating insufficient funds
4. **Given** I successfully create a buy order, **When** the transaction confirms, **Then** the modal closes and shows a success notification
5. **Given** my buy order is active, **When** a seller creates a matching or better sell order, **Then** the orders are automatically matched and executed

---

### User Story 3 - Unified Order Creation Interface (Priority: P1)

Users can access both sell and buy order creation from the same modal interface with clear visual separation and mode switching. The interface intelligently shows relevant validation based on order type (share ownership for sells, USDT balance for buys).

**Why this priority**: A unified interface reduces UI complexity and provides consistent user experience. This is critical for usability and should be implemented from the start rather than having two separate modals.

**Independent Test**: Can be tested by opening the order creation modal and switching between "Sell" and "Buy" modes, verifying that form fields, validations, and labels update appropriately. Delivers value through intuitive, consistent UX.

**Acceptance Scenarios**:

1. **Given** I am on the marketplace page, **When** I click "Create Order" button, **Then** a modal opens with tabs or toggle for "Sell Order" and "Buy Order"
2. **Given** the order modal is open in Sell mode, **When** I switch to Buy mode, **Then** the form labels and validations update to reflect buy order requirements
3. **Given** the order modal is in Sell mode, **When** I view the form, **Then** I see my available shares displayed prominently
4. **Given** the order modal is in Buy mode, **When** I view the form, **Then** I see my USDT balance displayed prominently
5. **Given** I switch between Sell and Buy modes, **When** I previously entered data in one mode, **Then** the form resets to prevent accidental wrong-mode submissions

---

### User Story 4 - Order Validation and Error Handling (Priority: P1)

The system validates all order inputs in real-time and provides clear, actionable error messages. Users understand what's wrong and how to fix it before submitting transactions.

**Why this priority**: Prevents failed transactions, gas waste, and user frustration. Essential for production quality and should be built in from the start.

**Independent Test**: Can be tested by entering various invalid inputs (negative numbers, decimals, exceeding balances) and verifying appropriate error messages appear. Delivers value by preventing user errors and wasted gas fees.

**Acceptance Scenarios**:

1. **Given** I am creating a sell order, **When** I enter 0 shares, **Then** I see an error "Must be a valid number of shares"
2. **Given** I am creating a buy order, **When** I enter a negative price, **Then** I see an error "Price must be greater than 0"
3. **Given** I am creating an order, **When** I leave required fields empty and try to submit, **Then** the submit button is disabled and I see field-level error messages
4. **Given** insufficient token allowance exists, **When** I submit an order, **Then** the system automatically requests approval before creating the order
5. **Given** I am creating a sell order, **When** I have pending sell orders for all my shares, **Then** I see an error indicating no shares available to list

---

### Edge Cases

- What happens when a user tries to create a sell order but has no shares?
  - System shows error message "You don't have any shares to sell" and prevents order creation
- What happens when a user's USDT balance changes between opening modal and submitting?
  - System validates balance at transaction time and fails with clear error if insufficient
- What happens when network congestion delays transaction confirmation?
  - User sees pending state with spinner, can safely close modal, order processes in background
- What happens when a user tries to create multiple identical orders?
  - System allows it (this is valid market behavior), each order gets unique ID
- What happens if a user cancels the approval transaction?
  - System detects rejection and shows message "Approval cancelled. Please approve to continue."
- What happens when gas prices are extremely high?
  - Wallet shows gas estimate, user can cancel. System provides informative pending states.
- What happens if smart contract is paused or in wrong state?
  - Transaction fails with error from contract, user sees friendly message to try again later

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a unified modal interface accessible from the marketplace page for creating both sell and buy orders
- **FR-002**: System MUST display two distinct modes within the modal: "Sell Order" and "Buy Order" with clear visual indication of current mode
- **FR-003**: System MUST validate sell orders against user's available share balance and prevent listing more shares than owned
- **FR-004**: System MUST validate buy orders against user's USDT token balance and prevent orders exceeding available funds
- **FR-005**: System MUST enforce whole number input for share quantities (no fractional shares)
- **FR-006**: System MUST enforce positive non-zero values for both share quantity and price fields
- **FR-007**: System MUST display user's current share balance prominently in sell order mode
- **FR-008**: System MUST display user's current USDT balance prominently in buy order mode
- **FR-009**: System MUST automatically check token allowance and request approval if insufficient before order creation
- **FR-010**: System MUST show real-time validation errors as user types in form fields
- **FR-011**: System MUST disable submit button when form has validation errors or required fields are empty
- **FR-012**: System MUST close modal automatically upon successful order creation
- **FR-013**: System MUST show transaction progress states: idle, pending approval, confirming approval, pending order creation, confirming order creation
- **FR-014**: System MUST display success notification when order is successfully created
- **FR-015**: System MUST display error notification with specific details when order creation fails
- **FR-016**: System MUST refresh the active orders list automatically after successful order creation
- **FR-017**: System MUST reset form fields when user switches between sell and buy modes
- **FR-018**: System MUST preserve modal state if user closes and reopens before transaction completion
- **FR-019**: System MUST calculate and display per-share price automatically based on total price and quantity
- **FR-020**: System MUST integrate with existing wallet connection system (no separate authentication)
- **FR-021**: System MUST support both sell order creation and buy order creation using the same smart contract interaction pattern as existing sell functionality
- **FR-022**: System MUST maintain consistent styling and component patterns with existing marketplace components
- **FR-023**: System MUST handle transaction failures gracefully and allow users to retry without losing form data

### Key Entities

- **Order**: Represents a marketplace order with attributes: order ID, creator address, share quantity, total price, order type (buy/sell), active status, creation timestamp
- **User Balance State**: Represents user's holdings including: bond share balance, USDT token balance, available shares (total minus pending orders)
- **Transaction State**: Represents ongoing blockchain transaction with states: approval needed, approving, approval confirmed, creating order, order confirmed, failed
- **Form Validation State**: Represents validation status with: field values, field errors, overall form validity, touched fields

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a sell order from the marketplace page in under 30 seconds (excluding blockchain confirmation time)
- **SC-002**: Users can create a buy order from the marketplace page in under 30 seconds (excluding blockchain confirmation time)
- **SC-003**: 95% of users successfully complete order creation on first attempt without validation errors (after form is fully filled)
- **SC-004**: Zero successful transactions for orders that exceed user balances (100% validation accuracy)
- **SC-005**: Modal interface responds to mode switching in under 200ms (instant user perception)
- **SC-006**: Users can identify which mode (buy/sell) they are in within 2 seconds of opening modal
- **SC-007**: Form validation errors appear within 500ms of invalid input
- **SC-008**: Successfully created orders appear in the active orders list within 5 seconds of transaction confirmation
- **SC-009**: Zero instances of duplicate order creation from accidental double-clicks or rapid submissions
- **SC-010**: 100% of order creation workflows show appropriate loading states during pending transactions

## Assumptions

- Smart contract already supports both `createSellOrder` and `createBuyOrder` functions (or buy order functionality will be added in parallel)
- Existing `useMarketplace` hook can be extended to support buy orders without breaking changes
- USDT token approval pattern works identically for both sell and buy orders
- Users have web3 wallet connected before accessing marketplace (existing requirement)
- Share quantities use 6 decimal precision matching USDT token standard
- Order matching logic (if buy orders auto-match with sells) is handled by smart contract, not frontend
- Existing transaction monitoring and toast notification system can be reused
- Form validation rules library already exists and can be extended
