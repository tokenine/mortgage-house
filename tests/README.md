# Mortgage House - E2E Tests

Self-contained Playwright test suite for Admin Panel blockchain integration.

## Quick Start

### 1. Install Dependencies

```bash
cd tests
pnpm install
```

### 2. Install Chromium Browser

```bash
pnpm run install:browsers
```

Or install all browsers (chromium, firefox, webkit):

```bash
pnpm exec playwright install --with-deps
```

### 3. Run Tests

**Without wallet (smoke test only):**
```bash
pnpm test
```

**With wallet automation (requires WALLET_E2E setup):**
```bash
BASE_URL=http://localhost:3000 WALLET_E2E=1 pnpm test
```

**Run specific browser:**
```bash
pnpm run test:chromium
```

**Run with UI mode:**
```bash
pnpm run test:ui
```

**Debug mode:**
```bash
pnpm run test:debug
```

## Test Scenarios

### Admin Panel Blockchain Flows

- ✅ **Access Control** - Verifies issuer-only access
- ⚠️ **Interest Distribution** - Requires WALLET_E2E
- ⚠️ **Principal Repayment** - Requires WALLET_E2E
- ⚠️ **Principal Withdrawal** - Requires WALLET_E2E
- ⚠️ **Realtime Events** - Requires WALLET_E2E

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BASE_URL` | Application URL | `http://localhost:3000` |
| `WALLET_E2E` | Enable wallet tests | `1` or `true` |
| `TEST_INTEREST_AMOUNT` | Test interest amount | `10` |
| `TEST_PRINCIPAL_AMOUNT` | Test principal amount | `25` |

## Project Structure

```
tests/
├── package.json              # Dependencies
├── playwright.config.ts      # Playwright config
├── admin-access.spec.ts      # Access control tests
├── interest-allowance.spec.ts
├── interest-approval-flow.spec.ts
├── principal-distribution.spec.ts
├── withdrawal.spec.ts
├── realtime-events.spec.ts
└── README.md                 # This file
```

## Test Reports

After running tests, view the HTML report:

```bash
pnpm run test:report
```

## CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8

- name: Install dependencies
  run: cd tests && pnpm install --frozen-lockfile

- name: Install browsers
  run: cd tests && pnpm exec playwright install --with-deps

- name: Run tests
  run: cd tests && pnpm test
  env:
    BASE_URL: http://localhost:3000
    CI: true
```

## Troubleshooting

### Chromium not installed
```bash
pnpm run install:browsers
```

### Port 3000 already in use
```bash
BASE_URL=http://localhost:3001 pnpm test
```

### Update Playwright
```bash
pnpm update @playwright/test --latest
pnpm exec playwright install
```

## More Information

- [Playwright Documentation](https://playwright.dev)
- [Test Plan](./test.plan.md)
