# Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered during development, testing, and deployment of mortage-house.

## Smart Contract Troubleshooting

### Compilation Issues

#### Problem: "Error: Compiler run failed"

```mermaid
graph TD
    A["Compilation<br/>Error"] -->|Check Version| B{"Foundry<br/>Updated?"}
    B -->|No| C["Run: foundryup"]
    C -->|Retry| A
    B -->|Yes| D{"Cache<br/>Clean?"}
    D -->|No| E["Run: forge clean"]
    E -->|Retry| A
    D -->|Yes| F{"Check<br/>pragma"]
    F -->|Wrong| G["Update pragma<br/>to ^0.8.20"]
    G -->|Retry| A
    F -->|Correct| H["✓ Build<br/>Succeeds"]
    
    style A fill:#ffcdd2
    style H fill:#c8e6c9
```

```bash
# Check Foundry version
forge --version

# Update Foundry
foundryup

# Clear cache
forge clean
forge build
```

#### Problem: "Error: import not found"

```bash
# Ensure all dependencies are installed
cd contracts
forge install

# Check lib/ directory structure
ls -la lib/

# If openzeppelin not found
forge install OpenZeppelin/openzeppelin-contracts
```

#### Problem: "Error: contracts not compatible with selected compiler version"

```solidity
// Ensure pragma matches
pragma solidity ^0.8.20;  // ✓ Correct for Foundry

// Check foundry.toml
[profile.default]
solc_version = "0.8.20"
```

### Testing Issues

#### Problem: "forge test: command not found"

```bash
# Verify Foundry is installed
which forge

# If not found, install Foundry
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
```

#### Problem: Test fails with "assertion failed"

```solidity
// Add verbose output to diagnose
forge test -vv --match-function testName

// Or with specific test file
forge test --match-path "test/MortgageContract.t.sol" -vv
```

**Example Debugging:**

```solidity
function testInvestFails() public {
  uint256 investAmount = 1000e6;
  
  // Debug output
  console.log("Investment amount:", investAmount);
  console.log("User balance before:", mockUsdt.balanceOf(user));
  
  // This will show what went wrong
  vm.prank(user);
  mortgageContract.invest(investAmount);
}

// Run with: forge test -vv
```

#### Problem: "Insufficient balance" in tests

```solidity
// Always mint test tokens first
function setUp() public {
  // Mint USDT to test users
  mockUsdt.mint(user1, 10000e6);  // 10,000 USDT
  mockUsdt.mint(user2, 5000e6);   // 5,000 USDT
}
```

#### Problem: "OutOfGas" error during tests

```bash
# Check gas usage
forge test --gas-report

# Increase gas limit in contract if needed
// In your test contract
vm.txGasPrice(1 gwei);

// Or modify foundry.toml
[profile.default]
gas_limit = 9223372036854775807
```

### Deployment Issues

#### Problem: "Error: failed to get code at address"

```bash
# Contract address doesn't exist on network
# Check:
# 1. Correct network RPC URL
# 2. Contract actually deployed
# 3. Not looking at wrong address

# Verify deployment
cast code <ADDRESS> --rpc-url <RPC_URL>

# If empty, contract not deployed to that address
```

#### Problem: "Error: account not found"

```bash
# Ensure account is configured
cast account dev1-deployer

# If missing, create account
cast wallet new

# Or import existing
cast wallet import <account-name> --interactive
```

#### Problem: "Error: insufficient funds"

```bash
# Deployer account doesn't have enough ETH/native token

# Check balance
cast balance <ACCOUNT_ADDRESS> --rpc-url <RPC_URL>

# Send funds to deployer
# Manual transfer or faucet request
```

#### Problem: "Error: nonce too high"

```bash
# Transaction nonce mismatch
# Solution: Reset account nonce or wait for pending transactions

# Check pending transactions
cast nonce <ACCOUNT_ADDRESS> --rpc-url <RPC_URL>

# Wait for all pending transactions to complete
# Then try again
```

**Data Flow Diagnosis for Deployment:**

```
┌─────────────────────────────────────────────┐
│   DEPLOYMENT TROUBLESHOOTING FLOW           │
├─────────────────────────────────────────────┤
│                                             │
│  Issue: Deployment Failed                   │
│    ↓                                        │
│  Check: Network & RPC Connection            │
│    │ Success? → Continue                    │
│    │ Failure? → Verify RPC URL              │
│    ↓                                        │
│  Check: Account & Balance                   │
│    │ Success? → Continue                    │
│    │ Failure? → Fund account                │
│    ↓                                        │
│  Check: Contract Code Validation            │
│    │ Success? → Continue                    │
│    │ Failure? → Recompile                   │
│    ↓                                        │
│  Check: Gas Limit & Price                   │
│    │ Success? → Deploy                      │
│    │ Failure? → Adjust parameters           │
│    ↓                                        │
│  Check: Contract State on Blockchain        │
│    │ Success → Deployment Complete! ✓      │
│    │ Failure → Analyze tx logs              │
│                                             │
└─────────────────────────────────────────────┘
```

## Frontend Troubleshooting

### Build Issues

#### Problem: "pnpm: command not found"

```bash
# Install pnpm
npm install -g pnpm

# Verify installation
pnpm --version
```

#### Problem: "Error: ENOENT: no such file or directory"

```bash
# Dependencies not installed
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Next.js cache
rm -rf .next
pnpm build
```

#### Problem: "Module not found" errors

```bash
# Check import path
// ❌ Wrong
import { Card } from './Card';

// ✓ Correct (use @/ alias)
import { Card } from '@/components/Card';

// Verify tsconfig.json has correct paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### Problem: "Error: Cannot find contract ABI"

```typescript
// Ensure ABI file exists
import { MortgageABI } from '@/abi/MortgageContract';

// Check file path
ls -la app/abi/

// Create ABI file if missing
echo '[{"inputs":[],"name":"FUNDING_CAP",...}]' > app/abi/MortgageContract.json
```

### Runtime Issues

#### Problem: Wallet won't connect

```typescript
// Check wallet injection
console.log('Ethereum provider:', window.ethereum);

// Debug Web3Modal
const { WagmiConfig, createConfig, configureChains } = require('wagmi');

// Ensure correct chain
const chainId = 1;  // 0xl3 Network

// Try alternative wallets
const [isConnected, setIsConnected] = useState(false);

useEffect(() => {
  if (typeof window !== 'undefined' && window.ethereum) {
    setIsConnected(true);
  }
}, []);
```

#### Problem: Contract calls fail

```typescript
// Debug contract interaction
const mortgageContract = new ethers.Contract(
  contractAddress,
  ABI,
  provider  // or signer
);

// Test read functions
const cap = await mortgageContract.FUNDING_CAP()
  .then(result => {
    console.log('✓ Contract connected:', result);
  })
  .catch(error => {
    console.error('✗ Contract error:', error);
    console.error('  - Check contract address:', contractAddress);
    console.error('  - Check ABI matches contract');
    console.error('  - Check network matches contract deployment');
  });
```

#### Problem: Transaction fails silently

```typescript
// Add comprehensive error handling
async function investWithErrorHandling(amount: string) {
  try {
    // 1. Validate input
    if (!amount || isNaN(Number(amount))) {
      throw new Error('Invalid amount');
    }

    // 2. Check wallet connected
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // 3. Check balance
    const balance = await usdtContract.balanceOf(address);
    const amountInWei = ethers.parseUnits(amount, 6);
    if (balance < amountInWei) {
      throw new Error(`Insufficient balance. Have: ${ethers.formatUnits(balance, 6)}, Need: ${amount}`);
    }

    // 4. Estimate gas
    const gasEstimate = await mortgageContract.invest.estimateGas(amountInWei);
    console.log('Estimated gas:', gasEstimate.toString());

    // 5. Execute transaction
    const tx = await mortgageContract.invest(amountInWei);
    console.log('Tx hash:', tx.hash);

    // 6. Wait for confirmation
    const receipt = await tx.wait(1);
    if (receipt.status === 1) {
      console.log('✓ Success!');
    } else {
      throw new Error('Transaction reverted on-chain');
    }
  } catch (error: any) {
    console.error('❌ Investment failed:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Full error:', error);
    
    // Handle specific errors
    if (error.code === 'INSUFFICIENT_FUNDS') {
      alert('Insufficient funds for gas');
    } else if (error.reason === 'Exceeds funding cap') {
      alert('Investment exceeds contract funding cap');
    } else {
      alert(`Error: ${error.message}`);
    }
  }
}
```

#### Problem: Slow page load

```typescript
// Use React.lazy for code splitting
import { lazy, Suspense } from 'react';

const InvestForm = lazy(() => import('./InvestForm'));
const Dashboard = lazy(() => import('./Dashboard'));

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <InvestForm />
      <Dashboard />
    </Suspense>
  );
}

// Run performance analysis
// pnpm build
// npx next-bundle-analyzer
```

### Network Issues

#### Problem: RPC timeout

```typescript
// Use fallback RPC providers
const RPC_URLS = [
  'https://rpc.0xl3.com',
  'https://backup-rpc.0xl3.com',
  'https://rpc2.0xl3.com',
];

async function connectWithFallback() {
  for (const rpcUrl of RPC_URLS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const blockNumber = await provider.getBlockNumber();
      console.log('✓ Connected to', rpcUrl);
      return provider;
    } catch (error) {
      console.warn('✗ Failed to connect to', rpcUrl);
      continue;
    }
  }
  throw new Error('All RPC endpoints failed');
}
```

#### Problem: "Cannot find transaction"

```typescript
// Transaction not yet mined
// Solution: Use event listener instead of polling

mortgageContract.on('Invested', (user, amount, event) => {
  if (user === userAddress) {
    console.log('✓ Investment confirmed!');
    console.log('Block:', event.blockNumber);
    console.log('Tx hash:', event.transactionHash);
  }
});
```

## Environment Configuration Issues

#### Problem: Environment variables not loading

```bash
# Create .env.local (frontend) or .env (contracts)
touch frontend/.env.local
touch contracts/.env

# Add variables (frontend only - must start with NEXT_PUBLIC_)
echo "NEXT_PUBLIC_RPC_URL=https://rpc.0xl3.com" >> frontend/.env.local

# Verify loading
console.log(process.env.NEXT_PUBLIC_RPC_URL);

# Restart dev server if changed
# pnpm dev
```

#### Problem: Different behavior in dev vs. production

```bash
# Common issues:
# 1. Environment variables not set in production
#    - Add to environment (Vercel, GitHub Actions, etc.)
# 2. Hard-coded localhost addresses
#    - Use environment variables instead
# 3. Browser console errors
#    - Check production build: pnpm build && pnpm start

# Debug production build locally
pnpm build
pnpm start
# Visit http://localhost:3000
```

## Common Data Flow Issues

```
┌────────────────────────────────────────────────┐
│     USER INPUT → CONTRACT → BLOCKCHAIN       │
│           DATA FLOW ISSUES                    │
├────────────────────────────────────────────────┤
│                                               │
│ Issue 1: Input Validation Fails               │
│   ├─ Check: Is amount > 0?                   │
│   ├─ Check: Is amount properly formatted?    │
│   └─ Solution: Use proper parsing             │
│                                               │
│ Issue 2: Approval Not Working                 │
│   ├─ Check: USDT approval > invest amount    │
│   ├─ Check: User approved correct contract   │
│   └─ Solution: Approve again with more funds  │
│                                               │
│ Issue 3: Transaction Fails on Blockchain      │
│   ├─ Check: Contract state allows action     │
│   ├─ Check: User has required balance        │
│   └─ Solution: Review contract requirements   │
│                                               │
│ Issue 4: Event Not Emitted                    │
│   ├─ Check: Transaction succeeded?            │
│   ├─ Check: Listening to correct event?      │
│   └─ Solution: Verify event name & filter    │
│                                               │
└────────────────────────────────────────────────┘
```

## Debugging Tools

### Smart Contracts

```bash
# Enable trace output
forge test -vvv --match-function testName

# See all storage changes
forge test -vvvv

# Get call stack
forge test --debug testName
```

### Frontend

```typescript
// Enable debug logging
localStorage.setItem('DEBUG', '*');

// Use Wagmi DevTools
import { WagmiDevtools } from '@wagmi/devtools';

function App() {
  return (
    <>
      <YourApp />
      <WagmiDevtools />
    </>
  );
}
```

## Getting Help

| Issue Type | Where to Ask |
|-----------|-------------|
| Setup problem | Check DEVELOPMENT-SETUP.md first |
| Contract error | Run `forge test -vvv` for debug output |
| Wallet issue | Check browser console (F12) |
| Performance | Profile with Chrome DevTools |
| Security concern | Email security@tokenine.com |

---

**Last Updated:** December 14, 2025  
**Version:** 1.0
