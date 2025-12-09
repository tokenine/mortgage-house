import { useState, useCallback } from "react"
import { useWaitForTransactionReceipt } from "wagmi"
import { toast } from "sonner"

interface TransactionState {
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
}

interface UseTransactionStateOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  successMessage?: string
}

export function useTransactionState(
  hash: `0x${string}` | undefined,
  options: UseTransactionStateOptions = {}
) {
  const [error, setError] = useState<Error | null>(null)

  const { 
    isConfirming, 
    isSuccess, 
    error: receiptError 
  } = useWaitForTransactionReceipt({ 
    hash,
    query: {
      enabled: !!hash,
      retry: true,
      retryDelay: 1000,
    }
  })

  const isPending = !!hash && !isConfirming && !isSuccess && !error

  if (receiptError && !error) {
    setError(receiptError)
    options.onError?.(receiptError)
    toast.error(`Transaction failed: ${receiptError.message}`)
  }

  if (isSuccess && !error) {
    options.onSuccess?.()
    if (options.successMessage) {
      toast.success(options.successMessage)
    }
  }

  const reset = useCallback(() => {
    setError(null)
  }, [])

  return {
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

export function useTransactionWithToast(
  hash: `0x${string}` | undefined,
  pendingMessage?: string,
  successMessage?: string
) {
  const state = useTransactionState(hash, {
    successMessage,
  })

  // Show pending toast when transaction starts
  if (hash && state.isPending && pendingMessage && !state.isConfirming) {
    toast.loading(pendingMessage, { id: hash })
  }

  // Update toast status
  if (hash && state.isConfirming) {
    toast.loading("Confirming transaction...", { id: hash })
  }

  if (hash && state.isSuccess) {
    toast.success(successMessage || "Transaction completed!", { id: hash })
  }

  if (hash && state.error) {
    toast.error(`Transaction failed: ${state.error.message}`, { id: hash })
  }

  return state
}