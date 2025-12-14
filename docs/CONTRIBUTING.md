# Contributing Guide

## Overview

This guide provides guidelines for contributing to mortage-house, including code standards, commit conventions, and pull request procedures.

## Contribution Workflow

```
┌───────────────────────────────────────────────────────────────┐
│        CONTRIBUTION & CODE REVIEW WORKFLOW                    │
└───────────────────────────────────────────────────────────────┘

Developer                 GitHub                    Tests
    │                        │                        │
    ├─ Fork Repository ─────>│                        │
    │                        │                        │
    ├─ Clone Locally ───────>│                        │
    │                        │                        │
    ├─ Create Branch ───────>│                        │
    │ (feature/xxx)          │                        │
    │                        │                        │
    ├─ Make Changes ────────>├─ Push to Remote ──────>│
    │                        │                        │
    ├─ Test Locally ────────>│                        ├─ Run Tests
    │ (forge test)           │                        │
    │ (pnpm test)            │                        │
    │                        │                        │
    ├─ Commit & Push ───────>├─ Trigger CI/CD ───────>├─ All Checks
    │                        │                        │
    ├─ Create PR ───────────>│ PR Created             │
    │                        │                        │
    ├─ Address Review ───────>├─ Request Changes      │
    │  Comments              │                        │
    │                        │                        │
    ├─ Update Code ────────>├─ Re-run Tests ────────>├─ Verify
    │                        │                        │
    ├─ Approve PR ──────────>├─ Merge to Main ──────>│
    │                        │                        │
    └─ Delete Branch ───────>└─ Deploy                └─ Production

```

## Getting Started

### 1. Fork & Clone

```bash
# Fork repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/mortgage-house.git
cd mortgage-house

# Add upstream remote
git remote add upstream https://github.com/tokenine/mortgage-house.git
git fetch upstream
```

### 2. Create Feature Branch

```bash
# Update main from upstream
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/documentation-update
```

## Code Standards

### Solidity Code Style

**File Organization:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Imports
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Interfaces
interface IExample {}

// Libraries (if any)
library MathLib {}

// Contract
contract MortgageBond {
    // Type declarations
    struct InvestorInfo {}
    enum Status {}
    
    // Constants (CONSTANT_CASE)
    uint256 public constant EXAMPLE_CONSTANT = 1000;
    
    // State variables (camelCase)
    uint256 public totalRaised;
    mapping(address => uint256) public balances;
    
    // Events
    event InvestmentMade(address indexed user, uint256 amount);
    
    // Modifiers
    modifier onlyIssuer() {}
    
    // Constructor
    constructor() {}
    
    // External functions
    function externalFunction() external {}
    
    // Public functions
    function publicFunction() public {}
    
    // Internal functions
    function _internalFunction() internal {}
    
    // Private functions
    function _privateFunction() private {}
    
    // View/Pure functions
    function getInfo() public view returns (uint256) {}
}
```

**Naming Conventions:**
```solidity
// Constants: UPPERCASE_WITH_UNDERSCORES
uint256 public constant MAX_SUPPLY = 1000000e18;

// Functions & Variables: camelCase
function calculateReward() public {}
uint256 totalRaised;

// Events: PascalCase with "ed" for past tense
event InvestmentMade(address indexed user, uint256 amount);

// Private/Internal functions: prefix with underscore
function _validateInput(uint256 amount) internal pure {}
```

**Comments & Documentation:**
```solidity
/**
 * @title Function Title
 * @notice Clear description of what function does
 * @dev Implementation details and any important notes
 * @param amount The investment amount in wei
 * @return success Whether operation succeeded
 * @custom:security Reentrancy protected by checks-effects-interactions
 */
function invest(uint256 amount) external returns (bool) {
    // ...
}
```

### TypeScript/JavaScript Code Style

**File Organization:**
```typescript
// Imports (sorted: external, internal, types)
import React from 'react';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';

import { formatAmount } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import type { Investment } from '@/types';

// Constants
const POLL_INTERVAL = 5000;
const DECIMAL_PLACES = 6;

// Types
interface ComponentProps {
  investmentId: string;
  onSuccess?: () => void;
}

// Component
export function InvestmentCard({ investmentId, onSuccess }: ComponentProps) {
  // Hooks
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Handlers
  const handleInvest = async () => {
    // ...
  };

  // Render
  return (
    <Card>
      {/* JSX */}
    </Card>
  );
}
```

**Naming Conventions:**
```typescript
// Components: PascalCase
function InvestmentForm() {}

// Functions: camelCase
const calculateProRata = (shares: number) => {};

// Constants: UPPERCASE_WITH_UNDERSCORES or camelCase
const MAX_INVESTMENT = 1000000;
const defaultConfig = { timeout: 5000 };

// Types: PascalCase
interface InvestorInfo {}
type TransactionStatus = 'pending' | 'success' | 'failed';

// Enums: PascalCase
enum OrderStatus {
  Active = 'ACTIVE',
  Filled = 'FILLED',
  Cancelled = 'CANCELLED',
}
```

**Code Quality:**
```typescript
// ESLint configuration (.eslintrc.json)
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-console": "warn",
    "no-debugger": "error",
    "prefer-const": "warn",
    "@next/next/no-html-link-for-pages": "error"
  }
}

// Run linting
pnpm lint
pnpm lint --fix  // Auto-fix issues
```

## Git Commit Conventions

Follow Conventional Commits specification:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semicolons)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

**Examples:**
```bash
# Feature
git commit -m "feat(contract): add pro-rata distribution"

# Bug fix
git commit -m "fix(frontend): fix wallet connection timeout"

# Documentation
git commit -m "docs: update deployment guide"

# Multiple lines
git commit -m "feat(marketplace): add sell order functionality

- Create sell orders for shares
- List active orders on marketplace
- Handle partial order fills

Fixes #123"
```

## Creating a Pull Request

### 1. Prepare Your Changes

```bash
# Make sure all tests pass
cd contracts
forge test

cd ../frontend
pnpm test
pnpm lint

# Check for any uncommitted changes
git status
```

### 2. Create PR on GitHub

**Title Format:**
```
[Type] Brief Description

Example: [Feature] Add pro-rata distribution for investors
```

**Description Template:**
```markdown
## Description
Clear description of what changes and why.

## Changes
- Change 1
- Change 2
- Change 3

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] All tests passing
- [ ] Manual testing completed

## Screenshots (if applicable)
Add relevant screenshots.

## Related Issues
Fixes #123

## Checklist
- [ ] Code follows style guidelines
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] Documentation updated
```

### 3. Code Review

**What to expect:**
- At least one approval required
- All CI/CD checks must pass
- No conflicts with main branch
- All conversations resolved

**Responding to feedback:**
```bash
# Make requested changes
git add .
git commit -m "refactor: address review feedback"

# Push updated changes
git push origin feature/your-feature-name

# Do NOT force push unless asked
```

## Testing Requirements

### Smart Contracts

```bash
# Must have 100% of critical functions tested
forge test --match-contract MortgageContractTest

# Coverage report
forge coverage

# Gas report
forge test --gas-report
```

### Frontend

```bash
# Unit tests required for new components
pnpm test

# E2E test for user flows
pnpm test:e2e

# No console errors
pnpm build
```

## Documentation Requirements

**Code comments:**
```typescript
// Bad: Obvious comment
const x = 5; // Set x to 5

// Good: Explains "why", not "what"
const delayMs = 5000; // Wait for RPC to finalize transaction
```

**Function documentation:**
```typescript
/**
 * Validates investment amount against contract limits
 * @param amount - Investment amount in USDT (wei)
 * @returns true if valid, throws error otherwise
 * @throws Error if amount exceeds funding cap
 */
function validateAmount(amount: bigint): boolean {}
```

**Update relevant docs:**
- If adding new smart contract function → update [API-REFERENCE.md](./API-REFERENCE.md)
- If changing deployment process → update [DEPLOYMENT.md](./DEPLOYMENT.md)
- If fixing security issue → update [SECURITY.md](./SECURITY.md)

## Performance Considerations

### Smart Contracts

**Gas optimization:**
```bash
# Check gas usage before submitting
forge test --gas-report

# Each function should be under budget:
# - invest: < 100k gas
# - claimRewards: < 90k gas
# - createSellOrder: < 60k gas
```

### Frontend

**Performance standards:**
```bash
# Build size
pnpm build  # Should complete without warnings

# Bundle analysis
pnpm analyze

# Lighthouse score (target >= 80)
```

## Release Process

```bash
# Maintainers only
# 1. Update version
npm version patch  # or minor/major

# 2. Create release on GitHub with changelog
# 3. Deploy to production

# 4. Tag release
git tag v1.0.0
git push origin v1.0.0
```

## Code Review Checklist

When reviewing, check:

- [ ] Follows code style guidelines
- [ ] Tests are comprehensive
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Performance impact considered
- [ ] Commit messages are clear

## Getting Help

- **Questions:** Create GitHub Discussion
- **Bugs:** Create GitHub Issue with reproduction steps
- **Security Issues:** Email security@tokenine.com (DO NOT create public issue)
- **Development Help:** Check [DEVELOPMENT-SETUP.md](./DEVELOPMENT-SETUP.md)

---

**Last Updated:** December 14, 2025  
**Version:** 1.0
