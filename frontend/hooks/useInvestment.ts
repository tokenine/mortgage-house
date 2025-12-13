"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACTS } from "@/lib/contracts"
import { formatErrorMessage } from "@/lib/validation"
import { parseUnits } from "viem"

interface InvestParams {
  amount: number
  projectId: string
}

interface UseInvestmentReturn {
  invest: (params: InvestParams) => Promise<void>
  loading: boolean
  error: string | null
  success: boolean
}

export function useInvestment(): UseInvestmentReturn {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { writeContractAsync } = useWriteContract()

  const invest = async ({ amount }: InvestParams) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      // Check wallet connection
      if (!isConnected || !address) {
        throw new Error("Unable to connect to wallet. Please check your wallet connection with troubleshooting steps")
      }

      // Convert amount to smallest unit (USDT has 6 decimals)
      const amountInSmallestUnit = parseUnits(amount.toString(), 6)

      // Call the invest function on the smart contract
      const hash = await writeContractAsync({
        ...CONTRACTS.mortgageBond,
        functionName: "invest",
        args: [amountInSmallestUnit],
        account: address,
      })

      // Wait for transaction confirmation
      // The transaction is now pending, show success message
      setSuccess(true)

      // Redirect to home page after brief delay to show success message
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      const errorMessage = formatErrorMessage(err)
      
      if (errorMessage.includes("user rejected") || errorMessage.includes("user denied")) {
        setError("Transaction cancelled by user")
      } else if (errorMessage.includes("insufficient")) {
        setError("Insufficient wallet balance or USDT approval required")
      } else {
        setError(errorMessage)
      }

      setLoading(false)
    }
  }

  return {
    invest,
    loading,
    error,
    success,
  }
}
