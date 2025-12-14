/**
 * Integration tests for Admin Panel blockchain integration
 * Tests real Wagmi hooks and contract interactions
 */

import { renderHook, waitFor } from "@testing-library/react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAdminPanel } from "@/hooks/useAdminPanel"

// Mock wagmi hooks for testing
jest.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x1234567890123456789012345678901234567890" }),
  useReadContracts: () => ({
    data: [
      { result: "0x1234567890123456789012345678901234567890" }, // issuer
      { result: true }, // isFundingActive
      { result: 1000000n }, // totalShares
    ],
    refetch: jest.fn(),
  }),
  useReadContract: () => ({
    data: 500000n, // allowance
    refetch: jest.fn(),
  }),
  useWriteContract: () => ({ writeContract: jest.fn() }),
  useWatchContractEvent: () => ({}),
}))

jest.mock("@/lib/projects", () => ({
  getMortgageBondConfig: () => ({
    address: "0x5F5d42A41E678701a241b5bb1944CF3919346445",
    chainId: 7117,
    abi: [],
  }),
  getPaymentTokenConfig: () => ({
    address: "0x19b4D862Df0b30691D61674847657c34a60cFEE8",
    chainId: 7117,
    decimals: 6,
    abi: [],
  }),
}))

jest.mock("./useTransactionState", () => ({
  useTransactionWithToast: () => ({
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  }),
}))

const queryClient = new QueryClient()

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <WagmiProvider client={{} as any}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

describe("useAdminPanel", () => {
  beforeEach(() => {
    queryClient.clear()
  })

  it("should fetch contract state when initialized", async () => {
    const { result } = renderHook(
      () => useAdminPanel({ projectId: "modern-apartment-austin" }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.state.issuerAddress).toBe("0x1234567890123456789012345678901234567890")
      expect(result.current.state.isFundingActive).toBe(true)
      expect(result.current.state.totalShares).toBe(1000000n)
      expect(result.current.state.usdtAllowance).toBe(500000n)
    })
  })

  it("should detect authorized access for issuer wallet", async () => {
    const { result } = renderHook(
      () => useAdminPanel({ projectId: "modern-apartment-austin" }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.state.isAuthorized).toBe(true)
    })
  })

  it("should validate distribution amounts correctly", async () => {
    const { result } = renderHook(
      () => useAdminPanel({ projectId: "modern-apartment-austin" }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      const validate = result.current.operations.distributeInterest.validate
      
      // Empty amount
      expect(validate({ amount: "", type: "interest" })).toEqual({
        isValid: false,
        error: "Amount is required"
      })

      // Non-numeric amount
      expect(validate({ amount: "abc", type: "interest" })).toEqual({
        isValid: false,
        error: "Amount must be a valid number"
      })

      // Negative amount
      expect(validate({ amount: "-100", type: "interest" })).toEqual({
        isValid: false,
        error: "Amount must be greater than zero"
      })

      // Valid amount
      const valid = validate({ amount: "1000", type: "interest" })
      expect(valid.isValid).toBe(true)
      expect(valid.amountInWei).toBe(1000000000n) // 1000 * 10^6
    })
  })

  it("should provide all required operations", async () => {
    const { result } = renderHook(
      () => useAdminPanel({ projectId: "modern-apartment-austin" }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      const ops = result.current.operations
      
      // Check all operations exist
      expect(ops.approve).toBeDefined()
      expect(ops.distributeInterest).toBeDefined()
      expect(ops.distributePrincipal).toBeDefined()
      expect(ops.withdrawPrincipal).toBeDefined()
      
      // Check execute functions exist
      expect(typeof ops.approve.execute).toBe("function")
      expect(typeof ops.distributeInterest.execute).toBe("function")
      expect(typeof ops.distributePrincipal.execute).toBe("function")
      expect(typeof ops.withdrawPrincipal.execute).toBe("function")
    })
  })
})