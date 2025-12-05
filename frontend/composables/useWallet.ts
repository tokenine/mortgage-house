import { computed, ref } from 'vue'
import { useWeb3 } from './useWeb3'
import { MortgageError, MortgageErrorHandler } from '~/types/errors'

export const useWallet = () => {
  const {
    isConnected,
    address,
    chainId,
    isConnecting,
    error,
    shortAddress,
    currentChain,
    isSupportedChain,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getBalance,
    balance: wagmiBalance
  } = useWeb3()

  // Wallet state
  const isLoadingBalance = ref(false)

  // Computed properties
  const walletInfo = computed(() => ({
    isConnected: isConnected.value,
    address: address.value,
    shortAddress: shortAddress.value,
    chainId: chainId.value,
    chainName: currentChain.value?.name || 'Unknown',
    isSupportedChain: isSupportedChain.value,
    balance: wagmiBalance.value?.value || 0n,
    error: error.value
  }))

  const connectionStatus = computed(() => {
    if (isConnecting.value) return 'connecting'
    if (isConnected.value) return 'connected'
    return 'disconnected'
  })

  const balance = computed(() => wagmiBalance.value?.value || 0n)

  // Methods
  const connect = async (connectorId?: string) => {
    try {
      const success = await connectWallet(connectorId)
      return success
    } catch (error) {
      if (error instanceof MortgageError) {
        throw error
      }
      throw MortgageError.fromError(error, { action: 'wallet_connect' })
    }
  }

  const disconnect = async () => {
    try {
      await disconnectWallet()
    } catch (error) {
      throw MortgageError.fromError(error, { action: 'wallet_disconnect' })
    }
  }

  const fetchBalance = () => {
    return wagmiBalance.value
  }

  const formatBalance = (balanceInWei: bigint | null, decimals = 4) => {
    if (!balanceInWei) return '0.0000 ETH'

    const ethValue = Number(balanceInWei) / 1e18
    return `${ethValue.toFixed(decimals)} ${wagmiBalance.value?.symbol || 'ETH'}`
  }

  const switchToSupportedNetwork = async () => {
    try {
      // Default to Ethereum Mainnet if not connected to a supported chain
      const targetChainId = chainId.value && isSupportedChain.value ? chainId.value : 1
      return await switchNetwork(targetChainId)
    } catch (error) {
      throw MortgageError.fromError(error, { action: 'switch_network' })
    }
  }

  return {
    // State - expose individual refs for direct access
    isConnected,
    address,
    chainId,
    isConnecting,
    error,
    shortAddress,
    currentChain,
    isSupportedChain,
    walletInfo,
    connectionStatus,
    balance,
    isLoadingBalance,
    formattedBalance: computed(() => formatBalance(balance.value)),
    wagmiBalance,

    // Methods
    connect,
    disconnect,
    fetchBalance,
    switchToSupportedNetwork,
    formatBalance
  }
}