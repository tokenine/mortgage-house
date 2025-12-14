# Testing Guide & Test Suite Documentation

## Overview

This document covers the complete testing strategy for mortage-house, including unit tests, integration tests, and testing procedures.

## Testing Architecture & Data Flow

```mermaid
graph TD
    A["Developer<br/>Code Change"] -->|Commit Code| B["Unit Tests<br/>Run"]
    B -->|invest()<br/>claimRewards()<br/>createSellOrder()| C{"All Tests<br/>Pass?"}
    C -->|No| D["❌ Fix Code"]
    D -->|Retry| B
    C -->|Yes| E["Integration Tests<br/>Run"]
    E -->|Full Flows<br/>Multi-step| F{"Integration<br/>Pass?"}
    F -->|No| G["❌ Fix Code"]
    G -->|Retry| E
    F -->|Yes| H["Gas Report<br/>Generated"]
    H -->|Check vs Budget| I{"Within<br/>Budget?"}
    I -->|No| J["⚠️ Optimize"]
    J -->|Reduce Gas| B
    I -->|Yes| K["Security Checks<br/>Run"]
    K -->|Reentrancy<br/>Overflow| L{"Security<br/>OK?"}
    L -->|No| M["❌ Fix Issues"]
    M -->|Retry| K
    L -->|Yes| N["Frontend Tests<br/>Run"]
    N -->|Components<br/>E2E<br/>Integration| O{"Frontend<br/>Pass?"}
    O -->|No| P["❌ Fix Code"]
    P -->|Retry| N
    O -->|Yes| Q["Code Review"]
    Q -->|Approved| R["✓ Merge to Main"]
    R -->|Deploy| S["Production"]
    
    style A fill:#e1f5ff
    style S fill:#c8e6c9
    style D fill:#ffcdd2
    style G fill:#ffcdd2
    style J fill:#fff3e0
    style M fill:#ffcdd2
    style P fill:#ffcdd2
```

## Smart Contract Testing

### Test Structure

```
contracts/
├── test/
│   ├── MortgageContract.t.sol       (Core functionality)
│   ├── MortgageEdgeCases.t.sol      (Edge cases & security)
│   └── Fuzz.t.sol                   (Fuzz testing)
└── src/
    └── MortgageContract.sol
```

### Running Tests

```bash
cd contracts

# Run all tests
forge test

# Run specific test file
forge test --match-path test/MortgageContract.t.sol

# Run specific test function
forge test --match-contract MortgageContractTest --match-function testInvest

# Run with verbose output
forge test -vv

# Run with gas report
forge test --gas-report

# Run specific tests and output gas report
forge test --gas-report --match-contract MortgageContractTest
```

### Test Coverage

```bash
# Generate coverage report
forge coverage

# Coverage targets
# - Line Coverage: >= 90%
# - Branch Coverage: >= 80%
# - Function Coverage: 100%
```

### Unit Tests: invest() Function

**Test File:** `test/MortgageContract.t.sol`

```solidity
function testInvestBasic() public {
  // Setup: Fund user with USDT
  uint256 investAmount = 1000e6; // 1000 USDT
  mockUsdt.mint(user, investAmount);
  
  // Precondition: User approves contract
  vm.prank(user);
  mockUsdt.approve(address(mortgageContract), investAmount);
  
  // Action: User invests
  vm.prank(user);
  mortgageContract.invest(investAmount);
  
  // Assertion: Check investor state
  (uint256 shares, , ) = mortgageContract.getInvestorInfo(user);
  assertEq(shares, investAmount, "Shares should equal investment");
  
  // Assertion: Check contract state
  assertEq(
    mortgageContract.totalPrincipalRaised(),
    investAmount,
    "Total raised should increase"
  );
}

function testInvestMultipleInvestors() public {
  // Setup: Multiple users
  uint256 amount1 = 1000e6;
  uint256 amount2 = 500e6;
  
  // Invest user 1
  mockUsdt.mint(user1, amount1);
  vm.prank(user1);
  mockUsdt.approve(address(mortgageContract), amount1);
  vm.prank(user1);
  mortgageContract.invest(amount1);
  
  // Invest user 2
  mockUsdt.mint(user2, amount2);
  vm.prank(user2);
  mockUsdt.approve(address(mortgageContract), amount2);
  vm.prank(user2);
  mortgageContract.invest(amount2);
  
  // Assertion: Total raised
  assertEq(
    mortgageContract.totalPrincipalRaised(),
    amount1 + amount2
  );
}

function testInvestExceedsFundingCap() public {
  uint256 cap = mortgageContract.FUNDING_CAP();
  uint256 excessAmount = cap + 1;
  
  mockUsdt.mint(user, excessAmount);
  vm.prank(user);
  mockUsdt.approve(address(mortgageContract), excessAmount);
  
  vm.prank(user);
  vm.expectRevert("Exceeds funding cap");
  mortgageContract.invest(excessAmount);
}

function testInvestWhenFundingInactive() public {
  // Setup: Deactivate funding
  vm.prank(issuer);
  mortgageContract.setFundingActive(false);
  
  vm.prank(user);
  vm.expectRevert("Funding not active");
  mortgageContract.invest(1000e6);
}
```

### Unit Tests: Distribution Functions

```solidity
function testDistributePrincipal() public {
  // Setup: User invests first
  uint256 investAmount = 1000e6;
  setupInvestment(user, investAmount);
  
  // Action: Distribute principal
  uint256 distributionAmount = 500e6;
  mockUsdt.mint(address(mortgageContract), distributionAmount);
  
  vm.prank(issuer);
  mortgageContract.distributePrincipal(distributionAmount);
  
  // Assertion: Check accPrincipalPerShare
  uint256 accPrincipal = mortgageContract.accPrincipalPerShare();
  assertEq(
    accPrincipal,
    distributionAmount,
    "Principal accumulated per share"
  );
}

function testDistributeInterest() public {
  // Setup: User invests first
  uint256 investAmount = 1000e6;
  setupInvestment(user, investAmount);
  
  // Action: Distribute interest
  uint256 interestAmount = 100e6;
  mockUsdt.mint(address(mortgageContract), interestAmount);
  
  vm.prank(issuer);
  mortgageContract.distributeInterest(interestAmount);
  
  // Assertion: Check interest accumulated
  (, uint256 interestDebt, ) = mortgageContract.getInvestorInfo(user);
  assertEq(interestDebt, interestAmount);
}

function testClaimRewards() public {
  // Setup: Invest and distribute
  uint256 investAmount = 1000e6;
  setupInvestment(user, investAmount);
  
  uint256 interestAmount = 100e6;
  mockUsdt.mint(address(mortgageContract), interestAmount);
  vm.prank(issuer);
  mortgageContract.distributeInterest(interestAmount);
  
  // Action: Claim rewards
  vm.prank(user);
  (uint256 interest, uint256 principal) = mortgageContract.claimRewards();
  
  // Assertion: Rewards claimed
  assertEq(interest, interestAmount);
  assertEq(principal, 0);
  
  // Assertion: User balance updated
  assertEq(mockUsdt.balanceOf(user), interestAmount);
}
```

### Integration Tests: Complete Flow

```solidity
function testCompleteInvestmentLifecycle() public {
  // Step 1: User A invests
  uint256 investA = 1000e6;
  setupInvestment(userA, investA);
  
  // Step 2: User B invests
  uint256 investB = 500e6;
  setupInvestment(userB, investB);
  
  // Step 3: Distribute interest
  uint256 interestAmount = 150e6;
  mockUsdt.mint(address(mortgageContract), interestAmount);
  vm.prank(issuer);
  mortgageContract.distributeInterest(interestAmount);
  
  // Step 4: Both users claim
  vm.prank(userA);
  (uint256 interestA, ) = mortgageContract.claimRewards();
  
  vm.prank(userB);
  (uint256 interestB, ) = mortgageContract.claimRewards();
  
  // Assertions: Pro-rata distribution verified
  uint256 totalInvested = investA + investB;
  uint256 expectedA = (investA * interestAmount) / totalInvested;
  uint256 expectedB = (investB * interestAmount) / totalInvested;
  
  assertEq(interestA, expectedA, "User A pro-rata share");
  assertEq(interestB, expectedB, "User B pro-rata share");
}

function testMarketplaceFlow() public {
  // Step 1: User A invests and creates sell order
  uint256 investAmount = 1000e6;
  setupInvestment(userA, investAmount);
  
  uint256 sharesToSell = 200;
  uint256 pricePerShare = 5e6;
  
  vm.prank(userA);
  uint256 orderId = mortgageContract.createSellOrder(
    sharesToSell,
    pricePerShare
  );
  
  // Step 2: User B purchases from marketplace
  uint256 totalCost = sharesToSell * pricePerShare;
  mockUsdt.mint(userB, totalCost);
  
  vm.prank(userB);
  mockUsdt.approve(address(mortgageContract), totalCost);
  
  vm.prank(userB);
  mortgageContract.fillSellOrder(orderId, sharesToSell);
  
  // Assertions: Shares transferred correctly
  (uint256 sharesA, , ) = mortgageContract.getInvestorInfo(userA);
  (uint256 sharesB, , ) = mortgageContract.getInvestorInfo(userB);
  
  assertEq(sharesA, investAmount - sharesToSell);
  assertEq(sharesB, sharesToSell);
}
```

### Gas Optimization Report

Run tests with gas reporting:

```bash
forge test --gas-report
```

**Expected Gas Benchmarks:**

| Function | Current | Target | Status |
|----------|---------|--------|--------|
| invest | 95,000 | < 100,000 | ✓ |
| claimRewards | 80,000 | < 90,000 | ✓ |
| createSellOrder | 50,000 | < 60,000 | ✓ |
| fillSellOrder | 120,000 | < 140,000 | ✓ |
| distributePrincipal | 70,000 | < 85,000 | ✓ |

## Frontend Testing

### Setup

```bash
cd frontend

# Install test dependencies
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Create test configuration
touch vitest.config.ts
```

### Component Tests

```typescript
// __tests__/components/InvestForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InvestForm } from '@/components/InvestForm';

describe('InvestForm', () => {
  it('should render investment form', () => {
    render(<InvestForm />);
    expect(screen.getByPlaceholderText(/amount/i)).toBeInTheDocument();
  });

  it('should validate amount input', async () => {
    render(<InvestForm />);
    const input = screen.getByPlaceholderText(/amount/i);
    
    fireEvent.change(input, { target: { value: '-100' } });
    fireEvent.click(screen.getByText(/invest/i));
    
    await waitFor(() => {
      expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
    });
  });

  it('should call invest function on submit', async () => {
    const mockInvest = vi.fn();
    render(<InvestForm onInvest={mockInvest} />);
    
    const input = screen.getByPlaceholderText(/amount/i);
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.click(screen.getByText(/invest/i));
    
    await waitFor(() => {
      expect(mockInvest).toHaveBeenCalledWith('1000');
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/investment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Investment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full investment flow', async ({ page }) => {
    // Step 1: Connect wallet
    await page.click('[data-testid="connect-wallet"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');

    // Step 2: Enter amount
    await page.fill('[data-testid="invest-amount"]', '1000');

    // Step 3: Approve USDT
    await page.click('[data-testid="approve-usdt"]');
    await page.waitForSelector('[data-testid="approve-success"]');

    // Step 4: Invest
    await page.click('[data-testid="invest-button"]');
    
    // Step 5: Verify transaction
    await expect(page.locator('[data-testid="tx-hash"]')).toBeVisible();
    const txHash = await page.textContent('[data-testid="tx-hash"]');
    expect(txHash).toMatch(/0x[a-f0-9]{64}/);
  });
});
```

### Contract Integration Tests

```typescript
// __tests__/integration/MortgageContract.test.ts
import { ethers } from 'ethers';
import { MortgageContractABI } from '@/abi/MortgageContract';

describe('MortgageContract Integration', () => {
  let contract: ethers.Contract;
  let provider: ethers.Provider;

  beforeAll(async () => {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    contract = new ethers.Contract(
      process.env.MORTGAGE_CONTRACT_ADDRESS,
      MortgageContractABI,
      provider
    );
  });

  it('should read contract state', async () => {
    const fundingCap = await contract.FUNDING_CAP();
    const totalRaised = await contract.totalPrincipalRaised();

    expect(fundingCap).toBeGreaterThan(0);
    expect(totalRaised).toBeLessThanOrEqual(fundingCap);
  });

  it('should emit Invested event on investment', async () => {
    const filter = contract.filters.Invested();
    const events = await contract.queryFilter(filter);

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].args.amount).toBeGreaterThan(0);
  });
});
```

## Running Full Test Suite

```bash
# Smart contracts
cd contracts && forge test && cd ..

# Frontend unit tests
pnpm test

# Frontend e2e tests
pnpm test:e2e

# Full coverage
pnpm coverage

# Continuous testing (watch mode)
forge test --watch
pnpm test --watch
```

## Test Success Criteria

- **Coverage:** >= 90% line coverage
- **All Tests Pass:** 0 failures
- **Gas Optimization:** All functions within gas budget
- **Security:** No critical vulnerabilities detected
- **Performance:** E2E tests complete in < 30 seconds

---

**Last Updated:** December 14, 2025  
**Version:** 1.0
