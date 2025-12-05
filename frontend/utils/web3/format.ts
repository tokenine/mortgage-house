import { formatEther, formatUnits, parseEther, parseUnits } from 'viem'

/**
 * Format wei amount to ether string
 */
export const formatEtherAmount = (amount: bigint, decimals = 4): string => {
  return formatEther(amount)
}

/**
 * Format wei amount to ether with fixed decimals
 */
export const formatEtherFixed = (amount: bigint, decimals = 4): string => {
  const etherValue = formatEther(amount)
  return parseFloat(etherValue).toFixed(decimals)
}

/**
 * Format any token amount with its decimals
 */
export const formatTokenAmount = (amount: bigint, tokenDecimals: number, displayDecimals = 4): string => {
  const formattedValue = formatUnits(amount, tokenDecimals)
  return parseFloat(formattedValue).toFixed(displayDecimals)
}

/**
 * Parse ether string to wei
 */
export const parseEtherAmount = (amount: string): bigint => {
  return parseEther(amount)
}

/**
 * Parse token string to token units
 */
export const parseTokenAmount = (amount: string, tokenDecimals: number): bigint => {
  return parseUnits(amount, tokenDecimals)
}

/**
 * Format address to short format
 */
export const formatAddress = (address: `0x${string}`, chars = 6): string => {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format gas price
 */
export const formatGasPrice = (gasPrice: bigint): string => {
  const gweiValue = Number(gasPrice) / 1e9
  return `${gweiValue.toFixed(2)} Gwei`
}

/**
 * Format transaction hash
 */
export const formatTransactionHash = (hash: `0x${string}`, chars = 8): string => {
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`
}

/**
 * Get block explorer URL
 */
export const getBlockExplorerUrl = (hash: `0x${string}`, chainId: number): string => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    137: 'https://polygonscan.com',
    // Add more chains as needed
  }

  const baseUrl = explorers[chainId] || 'https://etherscan.io'
  return `${baseUrl}/tx/${hash}`
}

/**
 * Convert timestamp to readable date
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calculate time remaining from deadline
 */
export const getTimeRemaining = (deadline: number): string => {
  const now = Math.floor(Date.now() / 1000)
  const remaining = deadline - now

  if (remaining <= 0) return 'Expired'

  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}