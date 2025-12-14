/**
 * Unified Marketplace Order Modal Component
 * 
 * Provides a single modal interface for creating both buy and sell orders on the marketplace.
 * Users can switch between modes using tabs, with form validation and transaction handling
 * for both token approval and order creation.
 * 
 * Features:
 * - Mode switching (sell/buy) via tabs
 * - Real-time form validation with mode-specific rules
 * - Token approval flow (checks allowance, requests approval if needed)
 * - Blockchain transaction management with loading states
 * - Comprehensive error handling with user-friendly messages
 * - Mobile-responsive design (320px+ viewports)
 * - Accessibility support (keyboard navigation, ARIA labels, focus management)
 * - Error boundary wrapper for component-level error handling
 * 
 * @example
 * ```tsx
 * import { OrderCreationModal } from '@/components/order-creation-modal'
 * 
 * function MarketplaceComponent() {
 *   const [isOpen, setIsOpen] = useState(false)
 *   
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>Create Order</button>
 *       <OrderCreationModal
 *         open={isOpen}
 *         onOpenChange={setIsOpen}
 *         onSuccess={() => refetchOrders()}
 *       />
 *     </>
 *   )
 * }
 * ```
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useTransactionWithToast } from '@/hooks/useTransactionState'
import { useMortgageBond } from '@/hooks/useMortgageBond'
import { getMortgageBondConfig, getPaymentTokenConfig } from '@/lib/projects'
import { useCurrentProject } from '@/contexts/ProjectContext'
import { OrderMode, OrderFormValues } from '@/types/marketplace'
import { getValidationRules } from '@/lib/order-validation'
import { OrderCreationErrorBoundary } from './order-creation-error-boundary'

interface OrderCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void // Callback to refresh order lists
}

/**
 * OrderCreationModalContent - Internal component that renders the modal content
 * 
 * Manages:
 * - Form state (shares, price) with real-time validation
 * - User balances (shares and USDT)
 * - Transaction state (approval and order creation)
 * - Mode switching (sell/buy) with form reset
 * - Error handling with user-friendly messages
 * 
 * Validation Rules:
 * - Sell Mode: shares ≤ available shares, price > 0
 * - Buy Mode: shares > 0, price ≤ available USDT
 * 
 * Transaction Flow:
 * 1. Check current token allowance
 * 2. If insufficient: Request approval, wait for confirmation
 * 3. Create order (sell or buy) with validated values
 * 4. Close modal and call onSuccess callback to refresh orders
 * 
 * @param open - Whether the modal is visible
 * @param onOpenChange - Callback to update modal visibility
 * @param onSuccess - Callback to refresh order list after successful creation
 */
function OrderCreationModalContent({
  open,
  onOpenChange,
  onSuccess,
}: OrderCreationModalProps) {
  const { address } = useAccount()
  const { currentProject } = useCurrentProject()
  const [mode, setMode] = useState<OrderMode>('sell')
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const isBuyOrderEnabled =
    (process.env.NEXT_PUBLIC_MARKETPLACE_ENABLE_CREATE_BUY_ORDER ?? 'false')
      .toLowerCase() === 'true'

  // Get contract configs from current project
  const mortgageBondConfig = currentProject ? getMortgageBondConfig(currentProject.id) : null
  const paymentTokenConfig = currentProject ? getPaymentTokenConfig(currentProject.id) : null

  // Fetch balances
  const { investorInfo } = useMortgageBond()
  const { data: usdtBalance } = useReadContract({
    address: paymentTokenConfig?.address,
    abi: paymentTokenConfig?.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!paymentTokenConfig,
    },
  })

  // Format balances for display
  const availableShares = investorInfo && (investorInfo as any)[0]
    ? formatUnits((investorInfo as any)[0] as bigint, 6)
    : '0'
  const availableUSDT = usdtBalance
    ? formatUnits(usdtBalance as bigint, 6)
    : '0'

  // Get validation rules based on mode
  const validationRules = useMemo(
    () =>
      getValidationRules({
        mode,
        availableShares,
        availableUSDT,
      }),
    [mode, availableShares, availableUSDT]
  )

  // Form state management
  const form = useFormValidation({
    initialValues: { shares: '', price: '' } as OrderFormValues,
    validationRules,
  })

  // Transaction hooks
  const { writeContract: writeApprove, data: approveTxHash } = useWriteContract()
  const { writeContract: writeOrder, data: orderTxHash } = useWriteContract()

  const approveState = useTransactionWithToast(
    approveTxHash,
    'Approving tokens...',
    'Tokens approved!'
  )

  const orderState = useTransactionWithToast(
    orderTxHash,
    mode === 'sell' ? 'Creating sell order...' : 'Creating buy order...',
    mode === 'sell' ? 'Sell order created!' : 'Buy order created!'
  )

  // Check token allowance
  const { data: allowance } = useReadContract({
    address: paymentTokenConfig?.address,
    abi: paymentTokenConfig?.abi,
    functionName: 'allowance',
    args:
      address && (mode === 'sell' || mode === 'buy') && mortgageBondConfig
        ? [address, mortgageBondConfig.address]
        : undefined,
    query: {
      enabled: !!address && (mode === 'sell' || mode === 'buy') && !!paymentTokenConfig && !!mortgageBondConfig,
    },
  })

  // Reset form when mode changes (FR-017)
  useEffect(() => {
    form.reset()
    setTransactionError(null)
  }, [mode])

  // Handle approval success - proceed to order creation
  useEffect(() => {
    if (approveState.isSuccess && !approveState.error) {
      const { shares, price } = form.values
      if (!address) return

      // After approval succeeds, create the order
      setTimeout(() => {
        if (mode === 'sell') {
          try {
            if (!mortgageBondConfig) throw new Error('Project configuration missing')
            writeOrder({
              address: mortgageBondConfig.address,
              abi: mortgageBondConfig.abi,
              functionName: 'createSellOrder',
              args: [parseUnits(shares, 6), parseUnits(price, 6)],
              account: address,
            })
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Order creation failed'
            setTransactionError(errorMsg)
            toast.error(`Order creation failed: ${errorMsg}`)
          }
        } else {
          try {
            if (!mortgageBondConfig) throw new Error('Project configuration missing')
            writeOrder({
              address: mortgageBondConfig.address,
              abi: mortgageBondConfig.abi,
              functionName: 'createBuyOrder',
              args: [parseUnits(shares, 6), parseUnits(price, 6)],
              account: address,
            })
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Order creation failed'
            setTransactionError(errorMsg)
            toast.error(`Order creation failed: ${errorMsg}`)
          }
        }
      }, 500)
    }
  }, [approveState.isSuccess, approveState.error, form.values, mode, address, writeOrder])

  // Close modal and call onSuccess after order creation
  useEffect(() => {
    if (orderState.isSuccess && !orderState.error) {
      setTransactionError(null)
      onOpenChange(false)
      onSuccess?.()
      form.reset()
    }
  }, [orderState.isSuccess, orderState.error, onOpenChange, onSuccess, form])

  // Handle errors from transactions
  useEffect(() => {
    if (approveState.error) {
      const errorMsg = approveState.error.message || 'Approval transaction failed'
      setTransactionError(errorMsg)
      toast.error(errorMsg)
    }
    if (orderState.error) {
      const errorMsg = orderState.error.message || 'Order creation failed'
      setTransactionError(errorMsg)
      toast.error(errorMsg)
    }
  }, [approveState.error, orderState.error])

  // Handle form submission
  const handleCreateOrder = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setTransactionError(null)

      if (!form.validateAll() || !address) {
        return
      }

      const { shares, price } = form.values

      try {
        if (mode === 'sell') {
          // Check if approval is needed for sell order
          const requiredAmount = parseUnits(price, 6)
          const currentAllowance = (allowance ?? BigInt(0)) as bigint

          if (currentAllowance < requiredAmount) {
            // Request approval first
            if (!paymentTokenConfig || !mortgageBondConfig) throw new Error('Project configuration missing')
            await writeApprove({
              address: paymentTokenConfig.address,
              abi: paymentTokenConfig.abi,
              functionName: 'approve',
              args: [
                mortgageBondConfig.address,
                requiredAmount,
              ],
              account: address,
            })
          } else {
            // Allowance sufficient, create sell order directly
            if (!mortgageBondConfig) throw new Error('Project configuration missing')
            await writeOrder({
              address: mortgageBondConfig.address,
              abi: mortgageBondConfig.abi,
              functionName: 'createSellOrder',
              args: [
                parseUnits(shares, 6),
                parseUnits(price, 6),
              ],
              account: address,
            })
          }
        } else {
          // Feature toggle: block buy order creation if disabled
          if (!isBuyOrderEnabled) {
            const msg = 'Buy order creation is disabled by configuration.'
            setTransactionError(msg)
            toast.error(msg)
            return
          }
          // Buy order - check allowance and create order
          const requiredAmount = parseUnits(price, 6)
          const currentAllowance = (allowance ?? BigInt(0)) as bigint

          if (currentAllowance < requiredAmount) {
            // Request approval first
            if (!paymentTokenConfig || !mortgageBondConfig) throw new Error('Project configuration missing')
            await writeApprove({
              address: paymentTokenConfig.address,
              abi: paymentTokenConfig.abi,
              functionName: 'approve',
              args: [
                mortgageBondConfig.address,
                requiredAmount,
              ],
              account: address,
            })
          } else {
            // Allowance sufficient, create buy order directly
            if (!mortgageBondConfig) throw new Error('Project configuration missing')
            await writeOrder({
              address: mortgageBondConfig.address,
              abi: mortgageBondConfig.abi,
              functionName: 'createBuyOrder',
              args: [
                parseUnits(shares, 6),
                parseUnits(price, 6),
              ],
              account: address,
            })
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Transaction failed'
        
        // Handle wallet disconnection
        if (errorMsg.includes('wallet') || errorMsg.includes('account')) {
          setTransactionError('Wallet disconnected. Please reconnect and try again.')
          toast.error('Wallet disconnected')
        } 
        // Handle user rejection
        else if (errorMsg.includes('rejected') || errorMsg.includes('Rejected')) {
          setTransactionError('Transaction was cancelled.')
          toast.error('Transaction cancelled')
        }
        // Handle contract errors
        else if (errorMsg.includes('paused') || errorMsg.includes('Paused')) {
          setTransactionError('Contract is temporarily paused. Please try again later.')
          toast.error('Contract is paused')
        }
        // Generic error
        else {
          setTransactionError(errorMsg)
          toast.error(`Error: ${errorMsg}`)
        }
      }
    },
    [
      form,
      mode,
      address,
      allowance,
      writeApprove,
      writeOrder,
      isBuyOrderEnabled,
    ]
  )

  // Check if submit button should be disabled
  const isLoading =
    approveState.isPending ||
    approveState.isConfirming ||
    orderState.isPending ||
    orderState.isConfirming
  const isDisabled = !form.isValid || isLoading || !address

  // Determine submit button text
  const getSubmitButtonText = () => {
    if (isLoading) {
      return mode === 'sell' ? 'Creating...' : 'Creating...'
    }
    if (mode === 'buy' && !isBuyOrderEnabled) {
      return 'Buy Disabled'
    }
    if (mode === 'sell' && allowance && (allowance as bigint) < parseUnits(form.values.price || '0', 6)) {
      return 'Approve Tokens'
    }
    if (mode === 'buy' && allowance && (allowance as bigint) < parseUnits(form.values.price || '0', 6)) {
      return 'Approve Tokens'
    }
    return mode === 'sell' ? 'Create Sell Order' : 'Create Buy Order'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Order</DialogTitle>
          <DialogDescription>
            {mode === 'sell'
              ? 'List your bond shares for sale on the secondary marketplace'
              : 'Create a buy order at your desired price point'}
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Error Display */}
        {transactionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{transactionError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCreateOrder}>
          <Tabs
            value={mode}
            onValueChange={(val) => {
              if (val === 'buy' && !isBuyOrderEnabled) return
              setMode(val as OrderMode)
            }}
          >
            <TabsList className={`grid w-full ${isBuyOrderEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="sell">Sell Order</TabsTrigger>
              {isBuyOrderEnabled && (
                <TabsTrigger value="buy">Buy Order</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="sell" className="space-y-4">
              {/* Balance Display */}
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">Available Shares</p>
                <p className="text-lg font-semibold">{availableShares}</p>
              </div>

              {/* Shares Input */}
              <div className="space-y-2">
                <Label htmlFor="sell-shares">Number of Shares</Label>
                <Input
                  id="sell-shares"
                  type="number"
                  placeholder="Enter number of shares"
                  value={form.fields.shares.value}
                  onChange={(e) => {
                    form.setValue('shares', e.target.value)
                    form.validateField('shares')
                  }}
                  disabled={isLoading}
                />
                {form.fields.shares.error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {form.fields.shares.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Price Input */}
              <div className="space-y-2">
                <Label htmlFor="sell-price">Total Price (USDT)</Label>
                <Input
                  id="sell-price"
                  type="number"
                  placeholder="Enter total price"
                  value={form.fields.price.value}
                  onChange={(e) => {
                    form.setValue('price', e.target.value)
                    form.validateField('price')
                  }}
                  disabled={isLoading}
                />
                {form.fields.price.error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {form.fields.price.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            {isBuyOrderEnabled && (
              <TabsContent value="buy" className="space-y-4">
                {/* Balance Display */}
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Available USDT</p>
                  <p className="text-lg font-semibold">{availableUSDT}</p>
                </div>

                {/* Shares Input */}
                <div className="space-y-2">
                  <Label htmlFor="buy-shares">Number of Shares</Label>
                  <Input
                    id="buy-shares"
                    type="number"
                    placeholder="Enter number of shares"
                    value={form.fields.shares.value}
                    onChange={(e) => {
                      form.setValue('shares', e.target.value)
                      form.validateField('shares')
                    }}
                    disabled={isLoading}
                  />
                  {form.fields.shares.error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        {form.fields.shares.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Price Input */}
                <div className="space-y-2">
                  <Label htmlFor="buy-price">Total Price (USDT)</Label>
                  <Input
                    id="buy-price"
                    type="number"
                    placeholder="Enter total price"
                    value={form.fields.price.value}
                    onChange={(e) => {
                      form.setValue('price', e.target.value)
                      form.validateField('price')
                    }}
                    disabled={isLoading}
                  />
                  {form.fields.price.error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        {form.fields.price.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isDisabled}>
              {getSubmitButtonText()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Exported component with error boundary wrapper
 */
export function OrderCreationModal(props: OrderCreationModalProps) {
  return (
    <OrderCreationErrorBoundary>
      <OrderCreationModalContent {...props} />
    </OrderCreationErrorBoundary>
  )
}
