"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useChainId } from "wagmi"
import { Button } from "@/components/ui/button"
import { Loader2, Coins } from "lucide-react"
import { toast } from "sonner"
import { getMortgageBondConfig } from "@/lib/projects"
import { useWaitForTransactionReceipt } from "wagmi"

interface ClaimButtonProps {
  projectId: string
  yield: number
  onClaimSuccess?: () => void
  className?: string
}

type ClaimStatus = "idle" | "pending" | "confirming" | "success" | "error"

export function ClaimButton({ projectId, yield: yieldAmount, onClaimSuccess, className }: ClaimButtonProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
      retry: true,
      retryDelay: 1000,
    },
  })

  // Determine button state
  const isLoading = isWritePending || isConfirming
  const isDisabled = !isConnected || yieldAmount <= 0 || isLoading || claimStatus === "pending"
  const hasError = claimStatus === "error"

  // Handle successful claim confirmation
  if (isSuccess && claimStatus !== "success") {
    setClaimStatus("success")
    setErrorMessage(null)
    toast.success(`Claimed $${yieldAmount.toFixed(2)} yield!`)
    onClaimSuccess?.()
    // Reset state after a brief moment
    setTimeout(() => {
      setClaimStatus("idle")
    }, 2000)
  }

  // Handle write errors
  if (writeError && claimStatus !== "error") {
    setClaimStatus("error")
    const errorMsg = (writeError as Error).message || "Claim failed"
    setErrorMessage(errorMsg)
    toast.error(`Claim error: ${errorMsg}`)
  }

  const handleClaim = async () => {
    // Reset previous errors
    setErrorMessage(null)
    setClaimStatus("idle")

    // Validation checks
    if (!isConnected) {
      toast.error("Wallet not connected")
      return
    }

    if (yieldAmount <= 0) {
      toast.error("No yield to claim")
      return
    }

    if (!address) {
      toast.error("Address not found")
      return
    }

    // Check if on correct network
    let config
    try {
      config = getMortgageBondConfig(projectId)
    } catch (err) {
      const errorMsg = (err as Error).message || "Invalid project configuration"
      setClaimStatus("error")
      setErrorMessage(errorMsg)
      toast.error(`Configuration error: ${errorMsg}`)
      return
    }

    // Network mismatch check
    if (chainId !== config.chainId) {
      const errorMsg = `Wrong network. Expected chain ${config.chainId}, got ${chainId}`
      setClaimStatus("error")
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
      return
    }

    setClaimStatus("pending")

    // Invoke contract write
    try {
      writeContract(
        {
          address: config.address,
          abi: config.abi,
          functionName: "claimRewards",
          args: [],
          account: address,
        },
        {
          onSuccess: () => {
            setClaimStatus("confirming")
            toast.info("Transaction submitted. Confirming...")
          },
          onError: (err) => {
            if ((err as Error).message.includes("User rejected")) {
              setClaimStatus("idle")
              toast.info("Claim cancelled")
            } else {
              setClaimStatus("error")
              setErrorMessage((err as Error).message || "Claim failed")
              toast.error(`Claim failed: ${(err as Error).message}`)
            }
          },
        }
      )
    } catch (err) {
      const errorMsg = (err as Error).message || "Unexpected error during claim"
      setClaimStatus("error")
      setErrorMessage(errorMsg)
      toast.error(`Error: ${errorMsg}`)
    }
  }

  // Determine button text and appearance
  let buttonText = "Claim"
  let buttonVariant: "default" | "outline" | "destructive" = "default"

  if (isWritePending) {
    buttonText = "Submitting..."
  } else if (isConfirming) {
    buttonText = "Confirming..."
  } else if (claimStatus === "success") {
    buttonText = "Claimed!"
  } else if (hasError) {
    buttonText = "Retry"
    buttonVariant = "destructive"
  }

  const tooltipText = !isConnected
    ? "Connect wallet to claim"
    : yieldAmount <= 0
      ? "No yield to claim"
      : errorMessage
        ? errorMessage
        : undefined

  return (
    <Button
      size="sm"
      variant={buttonVariant}
      className={`bg-success hover:bg-success/90 text-success-foreground ${className || ""}`}
      onClick={handleClaim}
      disabled={isDisabled}
      title={tooltipText}
    >
      {isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Coins className="mr-1 h-3 w-3" />}
      {buttonText}
    </Button>
  )
}
