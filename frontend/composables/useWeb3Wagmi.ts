/**
 * Web3 Composable with Wagmi Integration
 * Core Web3 functionality using wagmi hooks
 */

import { computed, ref } from 'vue'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
  useChains,
  useChainId,
  useEnsName,
  useEnsAvatar
} from '@wagmi/vue'
import { mainnet, polygon, optimism } from 'viem/chains'
import { injected, metaMask, walletConnect } from '@wagmi/connectors'
import { StructuredMortgageError, MortgageErrorSeverity } from '~/types/errors'

export const useWeb3Wagmi = () => {
  // Wagmi hooks
  const { address, isConnected, isConnecting, connector } = useAccount()
  const { connect: wagmiConnect, connectors, error: connectError } = useConnect()
  const { disconnect: wagmiDisconnect, error: disconnectError } = useDisconnect()
  const { switchChain, error: switchError } = useSwitchChain()
  const { chain, chains } = useChains()
  const { chainId } = useChainId()

  // ENS
  const { data: ensName } = useEnsName({ address: address.value })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName.value })

  // Balance
  const { data: balance, error: balanceError, refetch: refetchBalance } = useBalance({
    address: address.value
  })

  // State
  const isConnectingTo = ref<string | null>(null)

  // Supported chains
  const supportedChains = [mainnet, polygon, optimism]
  const isSupportedChain = computed(() => {
    return supportedChains.some(chain => chain.id === chainId.value)
  })

  // Computed properties
  const shortAddress = computed(() => {
    if (!address.value) return null
    return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`
  })

  const currentChain = computed(() => {
    if (!chainId.value) return null
    return chains.value.find(c => c.id === chainId.value) || null
  })

  const connectionStatus = computed(() => {
    if (isConnectingTo.value) return 'connecting'
    if (isConnecting.value) return 'connecting'
    if (isConnected.value) return 'connected'
    return 'disconnected'
  })

  // Methods
  const connectWallet = async (connectorId?: string) => {
    try {
      if (connectorId) {
        isConnectingTo.value = connectorId
        const selectedConnector = connectors.value.find(c => c.id === connectorId)
        if (selectedConnector) {
          await wagmiConnect({ connector: selectedConnector })
        } else {
          throw new StructuredMortgageError(
            'FRONTEND',
            'INVALID_CONNECTOR',
            `Connector "${connectorId}" not found`,
            undefined,
            MortgageErrorSeverity.MEDIUM,
            { connectorId }
          )
        }
      } else {
        // Connect with the first available connector
        if (connectors.value.length > 0) {
          await wagmiConnect({ connector: connectors.value[0] })
        }
      }
      return true
    } catch (error) {
      if (error instanceof StructuredMortgageError) {
        throw error
      }

      // Handle common wallet connection errors
      if (error.name === 'UserRejectedRequestError') {
        throw new StructuredMortgageError(
          'FRONTEND',
          'USER_REJECTED_TRANSACTION',
          'Wallet connection was cancelled',
          error.code?.toString(),
          MortgageErrorSeverity.LOW
        )
      }

      throw StructuredMortgageError.fromError(error, {
        action: 'wallet_connect',
        connectorId
      })
    } finally {
      isConnectingTo.value = null
    }
  }

  const disconnectWallet = async () => {
    try {
      await wagmiDisconnect()
      return true
    } catch (error) {
      throw StructuredMortgageError.fromError(error, {
        action: 'wallet_disconnect'
      })
    }
  }

  const switchNetwork = async (chainId: number) => {
    try {
      await switchChain({ chainId })
      return true
    } catch (error) {
      // Handle common network switch errors
      if (error.name === 'UserRejectedRequestError') {
        throw new StructuredMortgageError(
          'FRONTEND',
          'USER_REJECTED_TRANSACTION',
          'Network switch was cancelled',
          error.code?.toString(),
          MortgageErrorSeverity.LOW
        )
      }

      throw StructuredMortgageError.fromError(error, {
        action: 'switch_network',
        targetChainId: chainId
      })
    }
  }

  const getBalance = (tokenAddress?: `0x${string}`) => {
    return useBalance({
      address: address.value,
      token: tokenAddress,
      query: {
        enabled: computed(() => !!address.value)
      }
    })
  }

  // Combined error state
  const error = computed(() => {
    return connectError.value || disconnectError.value || switchError.value || balanceError.value
  })

  return {
    // Connection state
    address: computed(() => address.value),
    isConnected: computed(() => isConnected.value),
    isConnecting: computed(() => isConnecting.value || !!isConnectingTo.value),
    connector: computed(() => connector.value),
    connectionStatus,
    error,

    // Chain information
    chainId: computed(() => chainId.value),
    chain: computed(() => chain.value),
    chains: computed(() => chains.value),
    currentChain,
    isSupportedChain,

    // Available connectors
    connectors: computed(() => connectors.value),
    isConnectingTo: computed(() => isConnectingTo.value),

    // Balance
    balance,
    getBalance,
    refetchBalance,

    // ENS
    ensName: computed(() => ensName.value),
    ensAvatar: computed(() => ensAvatar.value),

    // Formatted address
    shortAddress,

    // Methods
    connectWallet,
    disconnectWallet,
    switchNetwork,

    // Computed helpers
    walletInfo: computed(() => ({
      address: address.value,
      shortAddress: shortAddress.value,
      ensName: ensName.value,
      ensAvatar: ensAvatar.value,
      isConnected: isConnected.value,
      chainId: chainId.value,
      chainName: currentChain.value?.name || 'Unknown',
      isSupportedChain: isSupportedChain.value,
      balance: balance.value,
      connector: connector.value?.name || 'Unknown'
    }))
  }
}