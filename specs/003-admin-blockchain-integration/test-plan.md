# Admin Panel Blockchain Integration Test Plan

## Application Overview

Test plan for Admin Panel real blockchain integration replacing mock handlers with Wagmi-based reads/writes for interest distribution, principal repayment, and principal withdrawal, covering access control, allowance handling, transaction lifecycle, validation, and real-time updates per spec 003-admin-blockchain-integration.

## Test Scenarios

### 1. Access Control & Setup

**Seed:** `seed.spec.ts`

#### 1.1. Issuer can access admin controls

**File:** `tests/admin/access-control/issuer-access.spec.ts`

**Steps:**
  1. 1. Connect wallet as issuer for configured project and open /admin.
  2. 2. Wait for contract reads to resolve (issuer, funding status, allowance).
  3. 3. Select the target bond from selector (default should auto-select first project).
  4. 4. Observe repayment and lifecycle panels.

**Expected Results:**
  - Issuer wallet bypasses Access Denied card; admin panels render.
  - Buttons for distribute interest/principal and withdraw principal respect canExecute state (enabled when requirements met).
  - Issuer address shown in lifecycle panel matches connected address.
  - State shows funding status and allowance values loaded (no placeholders).

#### 1.2. Non-issuer blocked from admin controls

**File:** `tests/admin/access-control/non-issuer-block.spec.ts`

**Steps:**
  1. 1. Connect with non-issuer wallet and open /admin.
  2. 2. Wait for contract reads to resolve.
  3. 3. Select any bond from selector.

**Expected Results:**
  - Access Denied card appears with connected and issuer addresses populated.
  - Repayment and lifecycle controls are hidden or inaccessible (no transaction buttons rendered).
  - No transactions can be initiated while unauthorized.

### 2. Interest Distribution

**Seed:** `seed.spec.ts`

#### 2.1. Interest distribution executes single transaction when allowance sufficient

**File:** `tests/admin/interest/interest-sufficient-allowance.spec.ts`

**Steps:**
  1. 1. Ensure USDT allowance for mortgage contract >= target amount (seed or pre-approve).
  2. 2. Connect issuer wallet and open /admin; select bond.
  3. 3. Enter valid interest amount below or equal to allowance.
  4. 4. Click Distribute Interest and confirm wallet signature.
  5. 5. Wait for transaction confirmation and event handling.

**Expected Results:**
  - Form accepts amount and enables submit (validation passes).
  - Only one wallet transaction is requested (no approval step).
  - Toast sequence shows pending/confirming/success for distribution.
  - PaymentDistributed/InterestDistributed event triggers refetch; allowance and totals remain accurate.
  - Buttons return to idle; no duplicate submission possible during pending state.

#### 2.2. Interest distribution triggers approval then distribution when allowance insufficient

**File:** `tests/admin/interest/interest-two-step-approval.spec.ts`

**Steps:**
  1. 1. Set USDT allowance below target amount (e.g., 0).
  2. 2. Connect issuer wallet and open /admin; select bond.
  3. 3. Enter valid interest amount greater than allowance.
  4. 4. Click Distribute Interest and confirm approval transaction in wallet.
  5. 5. After approval mines, confirm second transaction for distribution.
  6. 6. Wait for final confirmation and UI refresh.

**Expected Results:**
  - First wallet prompt is approve() for USDT; second is distributeInterest().
  - Toast sequence differentiates approval and distribution phases.
  - Allowance refetches after approval before distribution proceeds.
  - Distribution transaction succeeds; event watcher refetches state within 3s.
  - UI resets to ready state with updated allowance; no stranded loading indicators.

#### 2.3. Interest distribution validation and rejection handling

**File:** `tests/admin/interest/interest-validation-and-rejection.spec.ts`

**Steps:**
  1. 1. Load /admin as issuer.
  2. 2. Attempt to submit blank amount; attempt negative value; attempt non-numeric string.
  3. 3. Enter valid amount and click Distribute Interest, then reject transaction in wallet.
  4. 4. Observe UI state after rejection.

**Expected Results:**
  - Blank, negative, and non-numeric inputs blocked client-side with toast/errors; submit button remains disabled until valid.
  - On wallet rejection, error toast shown; button/loading states clear and canExecute returns true.
  - No transactions are sent on invalid input; no state mutations occur.

### 3. Principal Repayment

**Seed:** `seed.spec.ts`

#### 3.1. Principal repayment executes when allowance sufficient

**File:** `tests/admin/principal/principal-sufficient-allowance.spec.ts`

**Steps:**
  1. 1. Ensure USDT allowance >= principal repayment amount.
  2. 2. Connect issuer wallet and open /admin; select bond.
  3. 3. Enter valid principal amount and click Distribute Principal.
  4. 4. Confirm wallet transaction and wait for confirmation.

**Expected Results:**
  - Single transaction flow without approval; toast shows distribution progress.
  - Principal repayment reflected in PaymentDistributed (principal) event and UI refetch within 3s.
  - Buttons re-enable after success; isProcessing false.

#### 3.2. Principal repayment triggers approval when needed

**File:** `tests/admin/principal/principal-approval-flow.spec.ts`

**Steps:**
  1. 1. Set allowance below repayment amount.
  2. 2. Connect issuer wallet and open /admin; select bond.
  3. 3. Enter valid principal amount and submit.
  4. 4. Approve USDT in wallet, then approve distribution transaction when prompted.
  5. 5. Wait for confirmations.

**Expected Results:**
  - Two sequential wallet prompts: approve then distributePrincipalRepayment.
  - Allowance refetch occurs between steps; distribution only fires after approval success.
  - UI shows distinct toasts per phase; loading prevents double-clicks.
  - State updates with new allowance and repayment reflected.

#### 3.3. Principal repayment revert surfaces user-friendly error

**File:** `tests/admin/principal/principal-error-handling.spec.ts`

**Steps:**
  1. 1. Configure scenario causing revert (e.g., insufficient USDT balance or contract state disallows repayment).
  2. 2. Connect issuer wallet and open /admin; select bond.
  3. 3. Enter valid amount and submit distribution.
  4. 4. Confirm transaction in wallet and wait for revert.
  5. 5. Observe UI feedback.

**Expected Results:**
  - Toast/error message reflects revert reason (not generic failure).
  - State/inputs reset to ready; canExecute restored after error.
  - No silent failures; no lingering loading indicators.

### 4. Principal Withdrawal

**Seed:** `seed.spec.ts`

#### 4.1. Withdraw principal when funding active

**File:** `tests/admin/withdraw/withdraw-happy-path.spec.ts`

**Steps:**
  1. 1. Ensure contract funding is active with funded amount > 0.
  2. 2. Connect issuer wallet and open /admin; select bond (status shows funding).
  3. 3. Click Close Funding & Release Principal and confirm wallet transaction.
  4. 4. Wait for confirmation and event handling.

**Expected Results:**
  - Button enabled with no disabledReason; click initiates single withdrawPrincipal transaction.
  - Toast shows pending/confirming/success; isProcessing blocks repeat clicks.
  - Funding status flips to closed after confirmation; event/refetch updates UI within 3s.
  - Total shares/issuer info remain accurate.

#### 4.2. Withdraw disabled when funding closed

**File:** `tests/admin/withdraw/withdraw-disabled-when-closed.spec.ts`

**Steps:**
  1. 1. Use bond where isFundingActive is false (after withdrawal).
  2. 2. Connect issuer wallet and open /admin; select bond.
  3. 3. Inspect lifecycle panel buttons/tooltips.

**Expected Results:**
  - Withdraw button disabled; tooltip or disabledReason indicates funding already closed.
  - No wallet prompt occurs when clicking disabled control.
  - Status badge shows active/closed consistent with contract state.

#### 4.3. Withdraw prevents duplicate submission during pending state

**File:** `tests/admin/withdraw/withdraw-prevent-duplicate.spec.ts`

**Steps:**
  1. 1. Ensure funding active and withdraw allowed.
  2. 2. Connect issuer wallet and open /admin.
  3. 3. Click withdraw button once; while transaction pending/confirming, attempt rapid additional clicks.
  4. 4. Optionally simulate slow network to keep pending state longer.

**Expected Results:**
  - After first click, button disabled/isProcessing true; subsequent clicks do not send extra transactions.
  - Only one transaction hash observed; UI unblocks after completion or error.
  - Toast states align with single transaction lifecycle.

### 5. Real-time Synchronization & Events

**Seed:** `seed.spec.ts`

#### 5.1. Payment event triggers refetch within 3 seconds

**File:** `tests/admin/realtime/payment-event-refetch.spec.ts`

**Steps:**
  1. 1. Open /admin as issuer with bond selected; note current totals/allowance.
  2. 2. From separate session or script, emit PaymentDistributed/InterestDistributed event by executing distribution.
  3. 3. Observe admin UI without manual refresh.

**Expected Results:**
  - Within ~3s, UI refetches and reflects new totals/allowance as per event.
  - Event listener logs may appear in console (informational).
  - No manual refresh required; no stale state displayed.

#### 5.2. ShareTransfer event updates state without manual refresh

**File:** `tests/admin/realtime/share-transfer-refetch.spec.ts`

**Steps:**
  1. 1. Open /admin as issuer; note investor count/total shares (if displayed).
  2. 2. Trigger ShareTransfer/InvestmentMade transaction externally.
  3. 3. Observe admin UI for automatic refresh.

**Expected Results:**
  - UI refetches after event and updates displayed totals within ~3s.
  - No excessive duplicate refetches (debounce or single refresh).
  - No errors shown; page remains responsive.

#### 5.3. Event listeners clean up on navigation

**File:** `tests/admin/realtime/event-cleanup.spec.ts`

**Steps:**
  1. 1. Open /admin and keep browser devtools performance/memory panel open.
  2. 2. Navigate away (e.g., to /dashboard) and back to /admin multiple times (10+).
  3. 3. Monitor for lingering event listeners or increasing memory footprint.
  4. 4. Optionally trigger events while away to confirm no duplicate handling.

**Expected Results:**
  - No memory leak or accumulating listeners across navigations; listener count stable.
  - Events are not handled multiple times after repeated mounts/unmounts.
  - Admin UI continues to refetch correctly after returning.
