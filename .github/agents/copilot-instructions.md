# mortage-house Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-14

## Active Technologies
- TypeScript 5 (Next.js 16.0.7, React 19.2.0) + Wagmi 3.1.0, Viem 2.41.2, Sonner 1.7.4, React Hook Form 7.60.0 (003-admin-blockchain-integration)
- On-chain smart contract state (MortgageContract.sol), configuration in projects.json (003-admin-blockchain-integration)
- TypeScript (Next.js 14), Solidity (Foundry) + Next.js, Wagmi v2 (`useWriteContract`, `useWaitForTransactionReceipt`, `useWatchContractEvent`), Viem, shadcn/ui (004-claim-bond-yield)
- N/A (on-chain state via contract reads) (004-claim-bond-yield)

- TypeScript 5.x with React 19.2.0 and Next.js 16.0.7 + wagmi 3.1.0, viem 2.41.2, @radix-ui/react-dialog, @radix-ui/react-tabs (001-marketplace-order-modal)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x with React 19.2.0 and Next.js 16.0.7: Follow standard conventions

## Recent Changes
- 004-claim-bond-yield: Added TypeScript (Next.js 14), Solidity (Foundry) + Next.js, Wagmi v2 (`useWriteContract`, `useWaitForTransactionReceipt`, `useWatchContractEvent`), Viem, shadcn/ui
- 003-admin-blockchain-integration: Added TypeScript 5 (Next.js 16.0.7, React 19.2.0) + Wagmi 3.1.0, Viem 2.41.2, Sonner 1.7.4, React Hook Form 7.60.0

- 001-marketplace-order-modal: Added TypeScript 5.x with React 19.2.0 and Next.js 16.0.7 + wagmi 3.1.0, viem 2.41.2, @radix-ui/react-dialog, @radix-ui/react-tabs

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
