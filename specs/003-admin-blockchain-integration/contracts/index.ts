/**
 * Contract Exports
 * Central export point for all contract interfaces
 */

// Core types
export type {
  TransactionState,
  ContractConfig,
  PaymentTokenConfig,
  AdminPanelReadState,
  DistributionInput,
  DistributionValidation,
} from "./types"

export { TransactionStatus, DistributionType } from "./types"

// Event types
export type {
  InterestDistributedEvent,
  PrincipalRepaymentDistributedEvent,
  PrincipalWithdrawnEvent,
  AdminPanelEvent,
  EventHandler,
} from "./events"

// Operation types
export type {
  ApproveOperation,
  DistributeInterestOperation,
  DistributePrincipalOperation,
  WithdrawPrincipalOperation,
  AdminOperations,
} from "./operations"

// Main hook interface
export type {
  UseAdminPanelConfig,
  UseAdminPanelReturn,
  UseAdminPanel,
} from "./useAdminPanel.interface"
