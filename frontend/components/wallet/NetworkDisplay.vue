<template>
  <div class="network-display">
    <div class="network-indicator" :class="networkStatusClass">
      <div class="network-icon">
        <svg
          v-if="isConnected && isSupportedChain"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="8" fill="currentColor"/>
          <path
            d="M4 8l2 2 4-4"
            stroke="white"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else-if="isConnected && !isSupportedChain"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="8" fill="currentColor"/>
          <path
            d="M6 6l4 4M10 6l-4 4"
            stroke="white"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/>
          <path
            d="M9.5 5.5a2.5 2.5 0 1 1-5 0c0-2 2.5-2.5 2.5-2.5s2.5.5 2.5 2.5z"
            fill="currentColor"
          />
          <path
            d="M12 13.5c-1.5-1-4-1-4-1s-2.5 0-4 1"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <div class="network-text">
        <div class="network-name">
          {{ networkName }}
        </div>
        <div class="network-status">
          {{ networkStatusText }}
        </div>
      </div>

      <button
        v-if="isConnected && !isSupportedChain"
        @click="handleSwitchNetwork"
        class="switch-button"
      >
        Switch
      </button>
    </div>

    <!-- Network switch modal -->
    <div v-if="showNetworkModal" class="network-modal-overlay" @click="closeNetworkModal">
      <div class="network-modal" @click.stop>
        <h3>Select Network</h3>
        <div class="network-options">
          <button
            v-for="network in supportedNetworks"
            :key="network.id"
            @click="switchToNetwork(network.id)"
            class="network-option"
            :class="{ active: chainId === network.id }"
          >
            <div class="network-option-info">
              <div class="network-option-name">{{ network.name }}</div>
              <div class="network-option-chain">Chain ID: {{ network.id }}</div>
            </div>
            <div v-if="chainId === network.id" class="current-indicator">Current</div>
          </button>
        </div>
        <button @click="closeNetworkModal" class="cancel-button">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWallet } from '~/composables/useWallet'

// Composables
const {
  isConnected,
  chainId,
  currentChain,
  isSupportedChain,
  switchToSupportedNetwork
} = useWallet()

// Local state
const showNetworkModal = ref(false)

// Computed properties
const networkName = computed(() => {
  if (!isConnected.value) return 'Not Connected'
  if (!currentChain.value) return 'Unknown Network'
  return currentChain.value.name
})

const networkStatusText = computed(() => {
  if (!isConnected.value) return 'Connect wallet to continue'
  if (!isSupportedChain.value) return 'Unsupported network'
  return 'Connected'
})

const networkStatusClass = computed(() => {
  if (!isConnected.value) return 'disconnected'
  if (!isSupportedChain.value) return 'unsupported'
  return 'connected'
})

const supportedNetworks = [
  {
    id: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    color: '#627EEA'
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    color: '#8247E5'
  }
]

// Methods
const handleSwitchNetwork = () => {
  showNetworkModal.value = true
}

const closeNetworkModal = () => {
  showNetworkModal.value = false
}

const switchToNetwork = async (targetChainId: number) => {
  // This would use the switchNetwork function from useWeb3
  closeNetworkModal()
  await switchToSupportedNetwork()
}
</script>

<style scoped>
.network-display {
  position: relative;
}

.network-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.network-indicator.disconnected {
  border-color: #d1d5db;
  background-color: #f9fafb;
  color: #6b7280;
}

.network-indicator.connected {
  border-color: #10b981;
  background-color: #ecfdf5;
  color: #059669;
}

.network-indicator.unsupported {
  border-color: #f59e0b;
  background-color: #fffbeb;
  color: #d97706;
}

.network-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.network-text {
  flex: 1;
}

.network-name {
  font-weight: 600;
  line-height: 1.25;
}

.network-status {
  font-size: 0.75rem;
  opacity: 0.8;
  line-height: 1.25;
}

.switch-button {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 0.25rem;
  background-color: #f59e0b;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.switch-button:hover {
  background-color: #d97706;
}

.network-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.network-modal {
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.network-modal h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.network-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.network-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.network-option:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.network-option.active {
  border-color: #10b981;
  background-color: #ecfdf5;
}

.network-option-info {
  flex: 1;
}

.network-option-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.network-option-chain {
  font-size: 0.875rem;
  color: #6b7280;
}

.current-indicator {
  padding: 0.25rem 0.5rem;
  background-color: #10b981;
  color: white;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.cancel-button {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

@media (max-width: 640px) {
  .network-indicator {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
  }

  .network-name {
    font-size: 0.875rem;
  }

  .network-status {
    font-size: 0.6875rem;
  }

  .switch-button {
    padding: 0.1875rem 0.375rem;
    font-size: 0.6875rem;
  }
}
</style>