# Admin Panel Blockchain Playwright Plan

## Application Overview

Playwright plan for Admin Panel real blockchain flows in the tests/ folder: access control, allowance/approval, interest & principal distributions, withdrawal, error handling, and realtime refresh.

## Test Scenarios

### 1. Admin Panel Blockchain Flows

**Seed:** `seed.spec.ts`

#### 1.1. Access control blocks non-issuer and allows issuer

**File:** `tests/admin-access.spec.ts`

**Steps:**
  1. Open /admin with issuer wallet connected
  2. Verify admin panels render (repayment and lifecycle)
  3. Switch to non-issuer wallet and reload /admin
  4. Verify Access Denied card shows and action buttons are hidden

**Expected Results:**
  - Issuer sees controls; no access error
  - Non-issuer sees Access Denied with issuer/connected addresses; no actionable buttons

#### 1.2. Interest distribution with sufficient allowance

**File:** `tests/interest-allowance.spec.ts`

**Steps:**
  1. Ensure USDT allowance >= amount (prefund/approve in setup)
  2. Open /admin as issuer
  3. Enter valid interest amount and submit
  4. Confirm wallet tx and wait for success toast

**Expected Results:**
  - Only one transaction prompt (distributeInterest)
  - Toasts show pending/confirming/success; button disabled while processing
  - UI shows updated allowance/state after event/refetch

#### 1.3. Interest distribution triggers approval then distribute

**File:** `tests/interest-approval-flow.spec.ts`

**Steps:**
  1. Set allowance to 0 in setup
  2. Open /admin as issuer
  3. Enter valid interest amount and submit
  4. Approve USDT in first wallet prompt, then confirm distribution in second
  5. Wait for both confirmations and UI refresh

**Expected Results:**
  - Two prompts: approve then distributeInterest
  - Allowance refetched between steps
  - UI returns to ready state; no stranded loading

#### 1.4. Principal repayment distribution mirrors interest flow

**File:** `tests/principal-distribution.spec.ts`

**Steps:**
  1. Set allowance to 0 in setup
  2. Open /admin as issuer
  3. Enter valid principal amount and submit
  4. Approve USDT then confirm distributePrincipalRepayment
  5. Wait for confirmations and UI refresh

**Expected Results:**
  - Two-step flow executes; toasts for each phase
  - Allowance refreshed; repayment state updates after event

#### 1.5. Withdraw principal only when funding active and no double submits

**File:** `tests/withdrawal.spec.ts`

**Steps:**
  1. Ensure fundingActive true and funded amount > 0
  2. Open /admin as issuer
  3. Click Close Funding & Release Principal once; keep clicking rapidly while pending
  4. Wait for confirmation and state update

**Expected Results:**
  - Only one transaction sent; button disabled during pending/confirming
  - Funding status flips to closed; button stays disabled with reason afterward

#### 1.6. Realtime event updates and listener cleanup

**File:** `tests/realtime-events.spec.ts`

**Steps:**
  1. Open /admin as issuer and note displayed totals/allowance
  2. From secondary session emit PaymentDistributed/ShareTransfer event
  3. Observe UI without manual refresh
  4. Navigate away and back to /admin several times (10+), then emit another event

**Expected Results:**
  - UI refetches within ~3s after events; values change
  - No duplicate event handling or memory growth across remounts
  - Manual refresh not required
