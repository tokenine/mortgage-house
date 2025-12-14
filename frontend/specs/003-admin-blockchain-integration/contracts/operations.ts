/**
 * Transaction operation interfaces
 * Defines input/output contracts for admin write operations
 */

import type { TransactionState, DistributionInput, DistributionValidation } from "./types"

/**
 * Approve USDT operation
 */
export interface ApproveOperation {
  /**
   * Execute USDT approve transaction
   * @param amount - Amount to approve in wei
   */
  execute: (amount: bigint) => void

  /** Current transaction state */
  state: TransactionState

  /** Whether approval is currently processing */
  isProcessing: boolean

  /** Whether approval transaction can be executed */
  canExecute: boolean
}

/**
 * Distribute interest operation
 */
export interface DistributeInterestOperation {
  /**
   * Execute interest distribution transaction
   * Automatically handles approval if needed
   * @param amount - Amount to distribute in wei
   */
  execute: (amount: bigint) => void

  /** Current transaction state */
  state: TransactionState

  /** Whether distribution is currently processing */
  isProcessing: boolean

  /** Whether distribution can be executed */
  canExecute: boolean

  /**
   * Validate distribution input
   * @param input - Distribution input to validate
   * @returns Validation result
   */
  validate: (input: DistributionInput) => DistributionValidation
}

/**
 * Distribute principal repayment operation
 */
export interface DistributePrincipalOperation {
  /**
   * Execute principal repayment distribution transaction
   * Automatically handles approval if needed
   * @param amount - Amount to distribute in wei
   */
  execute: (amount: bigint) => void

  /** Current transaction state */
  state: TransactionState

  /** Whether distribution is currently processing */
  isProcessing: boolean

  /** Whether distribution can be executed */
  canExecute: boolean

  /**
   * Validate distribution input
   * @param input - Distribution input to validate
   * @returns Validation result
   */
  validate: (input: DistributionInput) => DistributionValidation
}

/**
 * Withdraw principal operation
 */
export interface WithdrawPrincipalOperation {
  /**
   * Execute principal withdrawal transaction
   * Withdraws all funded principal to issuer wallet and closes funding
   */
  execute: () => void

  /** Current transaction state */
  state: TransactionState

  /** Whether withdrawal is currently processing */
  isProcessing: boolean

  /** Whether withdrawal can be executed (requires funding to be active) */
  canExecute: boolean

  /** Reason why withdrawal cannot be executed (if canExecute is false) */
  disabledReason?: string
}

/**
 * Combined operations interface
 */
export interface AdminOperations {
  /** USDT approval operation */
  approve: ApproveOperation

  /** Interest distribution operation */
  distributeInterest: DistributeInterestOperation

  /** Principal repayment distribution operation */
  distributePrincipal: DistributePrincipalOperation

  /** Principal withdrawal operation */
  withdrawPrincipal: WithdrawPrincipalOperation
}
