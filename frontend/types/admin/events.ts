/**
 * Contract event interfaces
 * Matches event signatures from MortgageContract.sol
 */

import type { Address, Hash } from "viem"

/**
 * InterestDistributed event
 * Emitted when interest payment is distributed to investors
 */
export interface InterestDistributedEvent {
  /** Total interest amount distributed (in wei) */
  totalAmount: bigint
  /** Timestamp when distribution occurred */
  timestamp: bigint
  /** Block number where event was emitted */
  blockNumber: bigint
  /** Transaction hash that emitted the event */
  transactionHash: Hash
}

/**
 * PrincipalRepaymentDistributed event
 * Emitted when principal repayment is distributed to investors
 */
export interface PrincipalRepaymentDistributedEvent {
  /** Total principal amount distributed (in wei) */
  totalAmount: bigint
  /** Timestamp when distribution occurred */
  timestamp: bigint
  /** Block number where event was emitted */
  blockNumber: bigint
  /** Transaction hash that emitted the event */
  transactionHash: Hash
}

/**
 * PrincipalWithdrawn event
 * Emitted when issuer withdraws funded principal
 */
export interface PrincipalWithdrawnEvent {
  /** Address of the issuer who withdrew */
  issuer: Address
  /** Amount withdrawn (in wei) */
  amount: bigint
  /** Timestamp when withdrawal occurred */
  timestamp: bigint
  /** Block number where event was emitted */
  blockNumber: bigint
  /** Transaction hash that emitted the event */
  transactionHash: Hash
}

/**
 * Union type of all admin panel related events
 */
export type AdminPanelEvent =
  | InterestDistributedEvent
  | PrincipalRepaymentDistributedEvent
  | PrincipalWithdrawnEvent

/**
 * Event handler callback type
 */
export type EventHandler<T extends AdminPanelEvent> = (event: T) => void
