# Mortgage Bond Development Guide

## 1. Prerequisites
- **Foundry**: Ensure you have foundry installed (`forge`, `anvil`, `cast`).

## 2. Running Tests
Run the entire test suite to verify contract logic:
```bash
forge test -vvv
```

## 3. Local Deployment (Anvil)

### Step 1: Start Local Blockchain
Open a new terminal and run:
```bash
anvil
```
*Keep this terminal running.*

### Step 2: Deploy Contracts
In your contract directory, run the deployment script:
```bash
forge script script/DeployMortgageContract.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### Step 3: Deployment Output
The script will output the addresses of your deployed contracts. Example:
```
Mock USDT deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
MortgageBond deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Minted 50k mUSDT to test user: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

## 4. Frontend Integration
Use the addresses from the output above in your frontend configuration.
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337` (Anvil Default)
- **Test User Private Key** (Account #1): `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

## 5. Manual Interaction (Optional)
You can verify the state using `cast`:

**Check Balance of Test User:**
```bash
cast call <MOCK_USDT_ADDRESS> "balanceOf(address)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url http://127.0.0.1:8545
```
