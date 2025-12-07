---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: ["docs/analysis/product-brief-mortage-house-2025-12-05.md", "docs/sprint-artifacts/tech-spec-mortage-house-smart-contract-2025-12-05.md"]
workflowType: 'ux-design'
lastStep: 0
project_name: 'mortage-house'
user_name: 'Poom-work'
date: '2025-12-05'
---

# UX Design Specification mortage-house

**Author:** Poom-work
**Date:** 2025-12-05

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

mortage-house is a decentralized **Mortgage Bond Marketplace** where real-world property loans are tokenized into tradable "Bond Shares". Instead of a single lender, funding is crowdsourced from investors who buy shares (tokens). These shares earn pro-rata interest from the borrower's repayments. The platform features a secondary market where investors can trade their bond shares before maturity, creating liquidity for traditionally illiquid assets.

### Technology Stack & Design System
We are shifting to a modern, rapid-development stack to support the "Bond Marketplace" model:

*   **Framework**: Next.js 14 (App Router)
*   **Styling**: Tailwind CSS + shadcn/ui (Radix Primitives)
*   **Web3**: RainbowKit + Wagmi + Viem
*   **Icons**: Lucide React

## Core User Experience

### 1. The Investor Dashboard (Primary View)
*   **Portfolio Summary**: "Total Value Locked", "Unclaimed Rewards (USDT)", "Active Investments".
*   **Action Center**: A prominent "Claim Rewards" button that lights up when interest is distributed.
*   **My Bonds**: A list of bond tokens owned, showing "Principal Invested", "Interest Earned", and "Trade" options.

### 2. The Marketplace (Trading View)
*   **Live Order Book**: A list of "Sell Orders" created by other investors.
*   **Buy Interaction**: A simple "Buy" button on each order that triggers a wallet transaction.
*   **Sell Interaction**: A "Create Order" modal allowing investors to list their shares at a premium or discount.

### 3. The Property/Bond Detail View
*   **Funding Status**: A progress bar showing how much of the "Funding Cap" has been raised (e.g., "$50k / $100k").
*   **Bond Terms**: Clean display of APY, Maturity Date, and Underlying Asset Description.
*   ** invest Widget**: A simplified input field to "Mint/Invest" in the primary market if funding is still active.

### 4. The Issuer/Admin Panel
*   **Mint/Distribute**: Tools for the issuer to "Mint Repayment Tokens" and "Distribute Interest" to bondholders.
*   **Lifecycle Controls**: Buttons to "Close Funding" or "Withdraw Principal" to the borrower.

## v0 Generation Prompt
*Use this prompt to generate the initial UI:*

> "Create a dark-mode **Mortgage Bond DeFi Dashboard** using Next.js, Tailwind, and Lucide Icons.
>
> **Layout**: Sidebar navigation (Marketplace, My Portfolio, Admin). Top header with Wallet Connect button.
>
> **Dashboard (Home)**:
> 1.  **Stats Cards**: Total Invested ($12,500), Unclaimed Yield ($450), Active Bonds (3).
> 2.  **'My Bonds' Table**: Columns for Asset Name, Shares Owned, Current Value, and Action Buttons (Sell, Claim).
>
> **Marketplace Page**:
> 1.  **Tokenized Properties Grid**: Cards showing House Image, APY (7.5%), Funding Progress Bar (70%), and 'Invest' button.
> 2.  **Secondary Market List**: A table of 'Sell Orders' from other users with 'Buy Now' buttons.
>
> **Style**: Sleek, modern financial aesthetics. Dark slate background, emerald green for positive numbers (yield), indigo for primary actions."