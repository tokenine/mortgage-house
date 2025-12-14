/**
 * Shared types for Admin Panel blockchain integration
 */

import type { Address, Hash } from "viem"

/**
 * Transaction lifecycle states
 * Matches Wagmi hook states for write operations
 */
export enum TransactionStatus {
  /** No transaction initiated */
  Idle = "idle",
  /** Transaction submitted to wallet, awaiting user confirmation */
  Pending = "pending",
  /** Transaction sent to blockchain, awaiting block inclusion */
  Confirming = "confirming",
  /** Transaction mined and confirmed */
  Success = "success",
  /** Transaction rejected or reverted */
  Error = "error",
}

/**
 * Types of admin distribution operations
 */
export enum DistributionType {
  Interest = "interest",
  PrincipalRepayment = "principal",
}

/**
 * Transaction state for a single operation
 */
export interface TransactionState {
  /** Transaction hash (undefined if not yet submitted) */
  txHash?: Hash
  /** Current status of the transaction */
  status: TransactionStatus
  /** Error object if transaction failed */
  error?: Error
  /** Whether transaction is currently processing (pending or confirming) */
  isProcessing: boolean
}

/**
 * Contract configuration for a specific project
 */
export interface ContractConfig {
  /** Contract deployment address */
  address: Address
  /** Network chain ID */
  chainId: number
  /** Contract ABI */
  abi: unknown[] // Using unknown[] instead of Abi to avoid circular dependency
}

/**
 * Payment token (USDT) configuration
 */
export interface PaymentTokenConfig extends ContractConfig {
  /** Token decimals (6 for USDT) */
  decimals: number
}

/**
 * Admin panel read-only state
 */
export interface AdminPanelReadState {
  /** Address authorized to perform admin operations */
  issuerAddress?: Address
  /** Whether connected wallet matches issuer */
  isAuthorized: boolean
  /** Whether funding phase is currently active */
  isFundingActive: boolean
  /** Total investment shares issued */
  totalShares: bigint
  /** Current USDT approval amount for the contract */
  usdtAllowance: bigint
  /** Whether contract state is currently loading */
  isLoading: boolean
  /** Error from contract reads */
  error?: Error
}

/**
 * Distribution operation input
 */
export interface DistributionInput {
  /** Amount in display units (e.g., "1000" for 1000 USDT) */
  amount: string
  /** Type of distribution */
  type: DistributionType
}

/**
 * Distribution operation validation result
 */
export interface DistributionValidation {
  /** Whether input is valid */
  isValid: boolean
  /** Validation error message (if invalid) */
  error?: string
  /** Amount converted to wei (if valid) */
  amountInWei?: bigint
  /** Whether USDT approval is needed before distribution */
  needsApproval?: boolean
}
