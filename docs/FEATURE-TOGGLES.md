# Feature Toggles

This document lists all feature toggles available in the Mortgage House application.

## Overview

Feature toggles (also known as feature flags) allow controlled rollout of features and the ability to enable/disable functionality without code changes. All frontend feature toggles use environment variables with the `NEXT_PUBLIC_` prefix.

## Configuration

Feature toggles are configured in the `.env` file (or `.env.local` for local development). Copy `.env.example` to `.env` and adjust values as needed.

```bash
cd frontend
cp .env.example .env
```

## Available Feature Toggles

### 1. Marketplace Buy Orders

**Environment Variable:** `NEXT_PUBLIC_MARKETPLACE_ENABLE_CREATE_BUY_ORDER`

**Type:** Boolean (`'true'` or `'false'`)

**Default:** `false`

**Description:** Controls whether users can create buy orders in the marketplace modal.

**Behavior:**
- When `true`: Users can submit buy orders through the marketplace interface
- When `false`: Buy order creation is disabled, and a message is displayed to users

**Location:** Marketplace modal component

**Related Files:**
- `frontend/components/marketplace/order-modal.tsx`
- `frontend/.env.example`

---

### 2. Claim Rewards

**Environment Variable:** `NEXT_PUBLIC_ENABLE_CLAIM_REWARDS`

**Type:** Boolean (`'true'` or `'false'`)

**Default:** `false`

**Description:** Controls whether users can claim their investment rewards/yields from the dashboard.

**Behavior:**
- When `true`: "Claim Rewards" button is displayed and functional on the dashboard
- When `false`: Button is hidden and replaced with "Claim rewards feature coming soon" message

**Location:** Dashboard unclaimed yield card

**Related Files:**
- `frontend/components/dashboard-content.tsx`
- `frontend/.env.example`

---

## Usage in Code

### Reading Feature Toggles

Feature toggles are read from environment variables at build time. Use strict equality checks:

```typescript
const FEATURE_ENABLED = process.env.NEXT_PUBLIC_FEATURE_NAME === 'true'
```

### Implementing a Feature Toggle

1. **Add to `.env.example`:**
```bash
# Description of the feature
# Explain behavior when true/false
NEXT_PUBLIC_FEATURE_NAME=false
```

2. **Read in component:**
```typescript
const ENABLE_FEATURE = process.env.NEXT_PUBLIC_FEATURE_NAME === 'true'
```

3. **Use in JSX:**
```tsx
{ENABLE_FEATURE ? (
  <FeatureComponent />
) : (
  <ComingSoonMessage />
)}
```

4. **Document here:** Add an entry to this file with all details

## Best Practices

1. **Always provide defaults:** Set sensible default values in `.env.example`
2. **Use descriptive names:** Feature toggle names should clearly indicate what they control
3. **Add comments:** Include clear descriptions in `.env.example` about what each toggle does
4. **Document behavior:** Explain what happens when the toggle is on vs off
5. **Type safety:** Always use strict equality checks (`=== 'true'`)
6. **Clean up:** Remove feature toggles once features are fully rolled out and stable

## Deployment

Feature toggles can be set differently for each environment:

### Development
```bash
# .env.local
NEXT_PUBLIC_ENABLE_CLAIM_REWARDS=true
```

### Staging
```bash
# Set in hosting platform (Vercel, etc.)
NEXT_PUBLIC_ENABLE_CLAIM_REWARDS=true
```

### Production
```bash
# Set in hosting platform
NEXT_PUBLIC_ENABLE_CLAIM_REWARDS=false
```

## Troubleshooting

### Feature toggle not working

1. Verify the environment variable is set correctly in `.env`
2. Restart the development server after changing `.env` values
3. Check that you're using strict equality: `=== 'true'` (not `== true`)
4. Ensure the variable name starts with `NEXT_PUBLIC_` for client-side access

### Feature toggle undefined

- Make sure the variable is defined in `.env` or `.env.local`
- Verify you've copied `.env.example` to `.env`
- Check that Next.js has read the new environment variable (restart dev server)

## Related Documentation

- [Development Setup](./DEVELOPMENT-SETUP.md) - Environment configuration
- [Deployment](./DEPLOYMENT.md) - Production environment variables
- [Security](./SECURITY.md) - Best practices for environment variables
