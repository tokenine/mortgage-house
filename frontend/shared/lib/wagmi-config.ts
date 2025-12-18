import { createConfig, http } from "wagmi"
import { anvil } from "wagmi/chains"
import { injected, mock } from "wagmi/connectors"
import { defineChain } from "viem"

export const customChain = defineChain({
    id: 7117,
    name: 'Custom Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.0xl3.com'] },
    },
})

export const config = createConfig({
    chains: [customChain, anvil],
    connectors: [
        injected(),
        mock({
            accounts: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"], // Anvil Account #0 (Deployer)
        }),
    ],
    transports: {
        [customChain.id]: http(),
        [anvil.id]: http(),
    },
})
