/**
 * useAdminPanel Hook Interface
 * Main API contract for admin panel blockchain operations
 */

import type { AdminPanelReadState, AdminOperations } from "./types"
import type { EventHandler, AdminPanelEvent } from "./events"

/**
 * Configuration for useAdminPanel hook
 */
export interface UseAdminPanelConfig {
  /** Project ID to load configuration for */
  projectId: string

  /**
   * Optional callback when any admin event is detected
   * Useful for custom side effects beyond automatic state refetch
   */
  onEvent?: EventHandler<AdminPanelEvent>

  /**
   * Whether to enable real-time event listeners
   * @default true
   */
  enableEventListeners?: boolean
}

/**
 * Return type of useAdminPanel hook
 * Provides read state, write operations, and control methods
 */
export interface UseAdminPanelReturn {
  // ==================== READ STATE ====================

  /** Current contract state (issuer, funding status, shares, allowance) */
  state: AdminPanelReadState

  // ==================== WRITE OPERATIONS ====================

  /** Admin write operations (approve, distribute, withdraw) */
  operations: AdminOperations

  // ==================== CONTROL METHODS ====================

  /**
   * Manually refetch all contract state
   * Useful for force-refresh after external changes
   */
  refetch: () => Promise<void>

  /**
   * Reset all transaction states to idle
   * Useful for clearing error states or resetting UI
   */
  resetTransactions: () => void

  // ==================== COMPUTED STATE ====================

  /**
   * Whether any operation is currently processing
   * Useful for global loading indicators
   */
  isAnyOperationPending: boolean

  /**
   * Consolidated error from any operation or state read
   * Returns first error found, or undefined if none
   */
  error?: Error
}

/**
 * Hook signature
 */
export type UseAdminPanel = (config: UseAdminPanelConfig) => UseAdminPanelReturn
