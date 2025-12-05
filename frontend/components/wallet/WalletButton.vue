<template>
  <div class="wallet-button-container">
    <button
      v-if="!isConnected"
      @click="handleConnect"
      :disabled="isConnecting"
      class="wallet-button connect-button"
    >
      <span v-if="isConnecting">Connecting...</span>
      <span v-else>Connect Wallet</span>
    </button>

    <div v-else class="wallet-info">
      <button
        @click="toggleDropdown"
        class="wallet-button connected-button"
        :class="{ 'error': !!error }"
      >
        <span class="wallet-address">
          {{ shortAddress || formatAddress(address || '') }}
        </span>
        <span class="network-indicator" :class="{ 'wrong-network': !isSupportedChain }">
          {{ currentChain?.name || 'Wrong Network' }}
        </span>
      </button>

      <!-- Dropdown menu -->
      <div v-if="showDropdown" class="wallet-dropdown">
        <div class="wallet-details">
          <div class="detail-row">
            <span class="label">Address:</span>
            <span class="value">{{ address }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Balance:</span>
            <span class="value">{{ formattedBalance }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Network:</span>
            <span class="value" :class="{ 'error': !isSupportedChain }">
              {{ currentChain?.name || 'Unsupported' }}
            </span>
          </div>
        </div>

        <div class="wallet-actions">
          <button
            v-if="!isSupportedChain"
            @click="handleSwitchNetwork"
            class="action-button switch-network"
          >
            Switch to Ethereum
          </button>
          <button
            @click="handleDisconnect"
            class="action-button disconnect"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>

    <!-- Error toast -->
    <div v-if="error" class="error-toast">
      {{ error }}
      <button @click="clearError" class="close-button">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWallet } from '~/composables/useWallet'
import { formatAddress } from '~/utils/web3/format'

// Composables
const {
  isConnected,
  address,
  chainId,
  isConnecting,
  error,
  shortAddress,
  currentChain,
  isSupportedChain,
  connect,
  disconnect,
  fetchBalance,
  formattedBalance,
  switchToSupportedNetwork
} = useWallet()

// Local state
const showDropdown = ref(false)

// Methods
const handleConnect = async () => {
  await connect()
}

const handleDisconnect = () => {
  disconnect()
  showDropdown.value = false
}

const handleSwitchNetwork = async () => {
  await switchToSupportedNetwork()
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const clearError = () => {
  error.value = null
}

const closeDropdown = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.wallet-button-container')) {
    showDropdown.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

// Auto-refresh balance
let balanceInterval: NodeJS.Timeout | null = null

onMounted(() => {
  if (isConnected.value) {
    fetchBalance()
  }

  // Refresh balance every 30 seconds
  balanceInterval = setInterval(() => {
    if (isConnected.value) {
      fetchBalance()
    }
  }, 30000)
})

onUnmounted(() => {
  if (balanceInterval) {
    clearInterval(balanceInterval)
  }
})
</script>

<style scoped>
.wallet-button-container {
  position: relative;
  display: inline-block;
}

.wallet-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.connect-button {
  background-color: #3b82f6;
  color: white;
}

.connect-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.connect-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.connected-button {
  background-color: #10b981;
  color: white;
  position: relative;
}

.connected-button:hover {
  background-color: #059669;
}

.connected-button.error {
  background-color: #ef4444;
}

.wallet-address {
  font-family: monospace;
  font-weight: 600;
}

.network-indicator {
  font-size: 0.75rem;
  opacity: 0.9;
  padding: 0.125rem 0.25rem;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
}

.network-indicator.wrong-network {
  background-color: #fbbf24;
  color: #000;
}

.wallet-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 50;
  min-width: 250px;
}

.wallet-details {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.value {
  font-size: 0.875rem;
  color: #111827;
  font-family: monospace;
}

.value.error {
  color: #ef4444;
}

.wallet-actions {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switch-network {
  background-color: #f59e0b;
  color: white;
}

.switch-network:hover {
  background-color: #d97706;
}

.disconnect {
  background-color: #ef4444;
  color: white;
}

.disconnect:hover {
  background-color: #dc2626;
}

.error-toast {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: #ef4444;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

@media (max-width: 640px) {
  .wallet-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  .wallet-dropdown {
    right: -1rem;
    min-width: 200px;
  }

  .wallet-address {
    font-size: 0.75rem;
  }

  .network-indicator {
    font-size: 0.625rem;
  }
}
</style>