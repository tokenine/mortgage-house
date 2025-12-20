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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFormValidation } from '@/shared/hooks/useFormValidation'
import { useTransactionWithToast } from '@/shared/hooks/useTransactionState'
import { useMortgageBond } from '@/shared/hooks/useMortgageBond'
import { CONTRACTS } from '@/shared/lib/contracts'
import { useProjects } from '@/domains/projects/hooks/useProjects'
import { getMortgageBondConfig, getPaymentTokenConfig } from '@/domains/projects/lib/projects'
import { OrderMode, OrderFormValues } from '@/types/marketplace'
import { getValidationRules } from '@/domains/marketplace/lib/order-validation'
import { OrderCreationErrorBoundary } from '@/shared/ui'

interface OrderCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void // Callback to refresh order lists
}

function OrderCreationModalContent({
  open,
  onOpenChange,
  onSuccess,
}: OrderCreationModalProps) {
  const { address } = useAccount()
  const [mode, setMode] = useState<OrderMode>('sell')
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const isBuyOrderEnabled =
    (process.env.NEXT_PUBLIC_MARKETPLACE_ENABLE_CREATE_BUY_ORDER ?? 'false')
      .toLowerCase() === 'true'

  const { projects } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')

  // Set default project once projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const mortgageBondConfig = useMemo(() =>
    selectedProjectId ? getMortgageBondConfig(selectedProjectId) : null
    , [selectedProjectId])

  const paymentTokenConfig = useMemo(() =>
    selectedProjectId ? getPaymentTokenConfig(selectedProjectId) : null
    , [selectedProjectId])

  // Fetch balances for selected project
  const { investorInfo } = useMortgageBond(selectedProjectId)
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

  const initialValues = useMemo<OrderFormValues>(
    () => ({ shares: '', price: '' }),
    []
  )

  // Form state management
  const form = useFormValidation({
    initialValues,
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
      if (!address || !mortgageBondConfig) return

      // After approval succeeds, create the order
      setTimeout(() => {
        if (mode === 'sell') {
          try {
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
  }, [approveState.isSuccess, approveState.error, form.values, mode, address, writeOrder, mortgageBondConfig])

  // Close modal and call onSuccess after order creation
  useEffect(() => {
    if (orderState.isSuccess && !orderState.error) {
      setTransactionError(null)
      onOpenChange(false)
      onSuccess?.()
      form.reset()
    }
  }, [orderState.isSuccess, orderState.error, onOpenChange, onSuccess, form.reset])

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
          if (!paymentTokenConfig || !mortgageBondConfig) return

          // Check if approval is needed for sell order
          const requiredAmount = parseUnits(price, 6)
          const currentAllowance = (allowance ?? BigInt(0)) as bigint

          if (currentAllowance < requiredAmount) {
            // Request approval first
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

          if (!paymentTokenConfig || !mortgageBondConfig) return

          // Buy order - check allowance and create order
          const requiredAmount = parseUnits(price, 6)
          const currentAllowance = (allowance ?? BigInt(0)) as bigint

          if (currentAllowance < requiredAmount) {
            // Request approval first
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
      paymentTokenConfig,
      mortgageBondConfig,
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

        {/* Project Selection */}
        <div className="space-y-2">
          <Label htmlFor="project-select">Select Property</Label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger id="project-select">
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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


export function OrderCreationModal(props: OrderCreationModalProps) {
  return (
    <OrderCreationErrorBoundary>
      <OrderCreationModalContent {...props} />
    </OrderCreationErrorBoundary>
  )
}
