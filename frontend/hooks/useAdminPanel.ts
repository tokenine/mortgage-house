"use client"

import { useMemo, useCallback, useEffect, useState } from "react"
import { useAccount, useReadContracts, useReadContract, useWriteContract, useWatchContractEvent } from "wagmi"
import { parseUnits } from "viem"
import { toast } from "sonner"
import { getMortgageBondConfig, getPaymentTokenConfig } from "@/lib/projects"
import { useTransactionWithToast } from "./useTransactionState"
import type {
  UseAdminPanelConfig,
  UseAdminPanelReturn,
  AdminPanelReadState,
  TransactionState,
  DistributionInput,
  DistributionValidation,
  AdminOperations,
} from "@/types/admin"
import { TransactionStatus, DistributionType } from "@/types/admin"
import type { Address, Hash } from "viem"

/**
 * Admin panel hook for blockchain operations
 * Replaces mock alert/console.log implementations with real Wagmi integration
 */
export function useAdminPanel({ projectId, onEvent, enableEventListeners = true }: UseAdminPanelConfig): UseAdminPanelReturn {
  const { address: connectedAddress } = useAccount()
  
  // Get contract configurations
  const mortgageBondConfig = useMemo(() => {
    try {
      return getMortgageBondConfig(projectId)
    } catch (error) {
      console.error("Failed to get mortgage bond config:", error)
      return null
    }
  }, [projectId])
  
  const paymentTokenConfig = useMemo(() => {
    try {
      return getPaymentTokenConfig(projectId)
    } catch (error) {
      console.error("Failed to get payment token config:", error)
      return null
    }
  }, [projectId])

  // Batch read contract state
  const { data: contractState, refetch: refetchContracts, isLoading: isLoadingContracts } = useReadContracts({
    contracts: mortgageBondConfig ? [
      { ...mortgageBondConfig, functionName: "issuer" },
      { ...mortgageBondConfig, functionName: "isFundingActive" },
      { ...mortgageBondConfig, functionName: "totalShares" },
    ] : [],
    query: {
      enabled: !!mortgageBondConfig,
      retry: true,
    }
  })

  // Read USDT allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...paymentTokenConfig,
    functionName: "allowance",
    args: [connectedAddress as Address, mortgageBondConfig?.address as Address],
    query: {
      enabled: !!(connectedAddress && mortgageBondConfig && paymentTokenConfig),
      retry: true,
    }
  })

  // Write operations
  const { writeContract: writeApprove, data: approveTx } = useWriteContract()
  const { writeContract: writeDistributeInterest, data: distributeInterestTx } = useWriteContract()
  const { writeContract: writeDistributePrincipal, data: distributePrincipalTx } = useWriteContract()
  const { writeContract: writeWithdrawPrincipal, data: withdrawPrincipalTx } = useWriteContract()

  // Transaction states
  const approveState = useTransactionWithToast(approveTx, "Approving USDT...", "USDT approved!")
  const distributeInterestState = useTransactionWithToast(distributeInterestTx, "Distributing interest...", "Interest distributed!")
  const distributePrincipalState = useTransactionWithToast(distributePrincipalTx, "Distributing principal repayment...", "Principal repayment distributed!")
  const withdrawPrincipalState = useTransactionWithToast(withdrawPrincipalTx, "Withdrawing principal...", "Principal withdrawn!")

  // State for pending distribution after approval
  const [pendingDistribution, setPendingDistribution] = useState<{
    type: DistributionType
    amount: bigint
  } | null>(null)

  // Computed state
  const state: AdminPanelReadState = useMemo(() => {
    const issuerAddress = contractState?.[0]?.result as Address | undefined
    const isFundingActive = contractState?.[1]?.result as boolean | undefined
    const totalShares = contractState?.[2]?.result as bigint | undefined
    
    const isAuthorized = connectedAddress && issuerAddress 
      ? connectedAddress.toLowerCase() === issuerAddress.toLowerCase()
      : false

    return {
      issuerAddress,
      isAuthorized,
      isFundingActive: isFundingActive ?? false,
      totalShares: totalShares ?? 0n,
      usdtAllowance: allowance ?? 0n,
      isLoading: isLoadingContracts,
      error: undefined, // Will be set by individual read errors if any
    }
  }, [contractState, allowance, connectedAddress, isLoadingContracts])

  // Validation function
  const validateDistribution = useCallback((input: DistributionInput): DistributionValidation => {
    // Check non-empty
    if (!input.amount || input.amount.trim() === "") {
      return { isValid: false, error: "Amount is required" }
    }
    
    // Check numeric
    const numValue = Number(input.amount)
    if (isNaN(numValue)) {
      return { isValid: false, error: "Amount must be a valid number" }
    }
    
    // Check positive
    if (numValue <= 0) {
      return { isValid: false, error: "Amount must be greater than zero" }
    }
    
    // Convert to wei
    const amountInWei = parseUnits(input.amount, paymentTokenConfig?.decimals ?? 6)
    
    // Check approval needed
    const needsApproval = amountInWei > (allowance || 0n)
    
    return {
      isValid: true,
      amountInWei,
      needsApproval
    }
  }, [allowance, paymentTokenConfig?.decimals])

  // Auto-trigger distribution after approval
  useEffect(() => {
    if (approveState.isSuccess && pendingDistribution) {
      // Refetch allowance
      refetchAllowance()
      
      // Execute pending distribution
      if (pendingDistribution.type === DistributionType.Interest) {
        writeDistributeInterest({
          ...mortgageBondConfig!,
          functionName: "distributeInterest",
          args: [pendingDistribution.amount]
        })
      } else if (pendingDistribution.type === DistributionType.Principal) {
        writeDistributePrincipal({
          ...mortgageBondConfig!,
          functionName: "distributePrincipalRepayment",
          args: [pendingDistribution.amount]
        })
      }
      
      // Clear pending distribution
      setPendingDistribution(null)
    }
  }, [approveState.isSuccess, pendingDistribution, mortgageBondConfig, writeDistributeInterest, writeDistributePrincipal, refetchAllowance])

  // Event listeners
  useWatchContractEvent({
    ...mortgageBondConfig!,
    eventName: "PaymentDistributed",
    onLogs: (logs) => {
      if (enableEventListeners) {
        console.info("PaymentDistributed event detected:", logs)
        refetchContracts()
        logs.forEach(log => {
          if (onEvent) {
            const eventType = log.args.paymentType === "Interest" ? "InterestDistributed" : "PrincipalRepaymentDistributed"
            onEvent({
              totalAmount: log.args.amountDeclared as bigint,
              timestamp: BigInt(Date.now() / 1000),
              blockNumber: log.blockNumber as bigint,
              transactionHash: log.transactionHash as Hash,
            } as any)
          }
        })
      }
    }
  })

  useWatchContractEvent({
    ...mortgageBondConfig!,
    eventName: "ShareTransfer",
    onLogs: () => {
      if (enableEventListeners) {
        refetchContracts()
      }
    }
  })

  // Operations
  const operations: AdminOperations = useMemo(() => {
    const createTransactionState = (state: ReturnType<typeof useTransactionWithToast>): TransactionState => ({
      txHash: state.isPending || state.isConfirming ? undefined : undefined,
      status: state.isPending ? TransactionStatus.Pending :
              state.isConfirming ? TransactionStatus.Confirming :
              state.isSuccess ? TransactionStatus.Success :
              state.error ? TransactionStatus.Error :
              TransactionStatus.Idle,
      error: state.error || undefined,
      isProcessing: state.isPending || state.isConfirming,
    })

    return {
      approve: {
        execute: (amount: bigint) => {
          if (!paymentTokenConfig || !mortgageBondConfig) {
            toast.error("Contract configuration not loaded")
            return
          }
          writeApprove({
            ...paymentTokenConfig,
            functionName: "approve",
            args: [mortgageBondConfig.address, amount]
          })
        },
        state: createTransactionState(approveState),
        isProcessing: approveState.isPending || approveState.isConfirming,
        canExecute: !!(connectedAddress && paymentTokenConfig && mortgageBondConfig && !approveState.isProcessing),
      },
      distributeInterest: {
        execute: (amount: bigint) => {
          if (!mortgageBondConfig || !paymentTokenConfig) {
            toast.error("Contract configuration not loaded")
            return
          }
          
          // Check if approval needed
          if (amount > (allowance || 0n)) {
            // Approve first
            writeApprove({
              ...paymentTokenConfig,
              functionName: "approve",
              args: [mortgageBondConfig.address, amount]
            })
            // Set pending distribution
            setPendingDistribution({ type: DistributionType.Interest, amount })
          } else {
            // Direct distribution
            writeDistributeInterest({
              ...mortgageBondConfig,
              functionName: "distributeInterest",
              args: [amount]
            })
          }
        },
        state: createTransactionState(distributeInterestState),
        isProcessing: distributeInterestState.isPending || distributeInterestState.isConfirming,
        canExecute: !!(connectedAddress && mortgageBondConfig && !distributeInterestState.isProcessing),
        validate: validateDistribution,
      },
      distributePrincipal: {
        execute: (amount: bigint) => {
          if (!mortgageBondConfig || !paymentTokenConfig) {
            toast.error("Contract configuration not loaded")
            return
          }
          
          // Check if approval needed
          if (amount > (allowance || 0n)) {
            // Approve first
            writeApprove({
              ...paymentTokenConfig,
              functionName: "approve",
              args: [mortgageBondConfig.address, amount]
            })
            // Set pending distribution
            setPendingDistribution({ type: DistributionType.Principal, amount })
          } else {
            // Direct distribution
            writeDistributePrincipal({
              ...mortgageBondConfig,
              functionName: "distributePrincipalRepayment",
              args: [amount]
            })
          }
        },
        state: createTransactionState(distributePrincipalState),
        isProcessing: distributePrincipalState.isPending || distributePrincipalState.isConfirming,
        canExecute: !!(connectedAddress && mortgageBondConfig && !distributePrincipalState.isProcessing),
        validate: validateDistribution,
      },
      withdrawPrincipal: {
        execute: () => {
          if (!mortgageBondConfig) {
            toast.error("Contract configuration not loaded")
            return
          }
          writeWithdrawPrincipal({
            ...mortgageBondConfig,
            functionName: "withdrawPrincipal",
            args: []
          })
        },
        state: createTransactionState(withdrawPrincipalState),
        isProcessing: withdrawPrincipalState.isPending || withdrawPrincipalState.isConfirming,
        canExecute: !!(connectedAddress && mortgageBondConfig && state.isFundingActive && !withdrawPrincipalState.isProcessing),
        disabledReason: state.isFundingActive ? undefined : "Funding is already closed",
      },
    }
  }, [
    connectedAddress, mortgageBondConfig, paymentTokenConfig, allowance, state.isFundingActive,
    approveState, distributeInterestState, distributePrincipalState, withdrawPrincipalState,
    writeApprove, writeDistributeInterest, writeDistributePrincipal, writeWithdrawPrincipal,
    validateDistribution
  ])

  // Control methods
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchContracts(),
      refetchAllowance()
    ])
  }, [refetchContracts, refetchAllowance])

  const resetTransactions = useCallback(() => {
    // Reset states would require the underlying hooks to support reset
    // For now, just clear pending distribution
    setPendingDistribution(null)
  }, [])

  // Computed properties
  const isAnyOperationPending = useMemo(() => {
    return operations.approve.isProcessing ||
           operations.distributeInterest.isProcessing ||
           operations.distributePrincipal.isProcessing ||
           operations.withdrawPrincipal.isProcessing
  }, [operations])

  const error = useMemo(() => {
    return state.error ||
           operations.approve.state.error ||
           operations.distributeInterest.state.error ||
           operations.distributePrincipal.state.error ||
           operations.withdrawPrincipal.state.error
  }, [state, operations])

  return {
    state,
    operations,
    refetch,
    resetTransactions,
    isAnyOperationPending,
    error,
  }
}