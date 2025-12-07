import { createConfig, http } from "wagmi"
import { anvil } from "wagmi/chains"
import { injected, mock } from "wagmi/connectors"

export const config = createConfig({
    chains: [anvil],
    connectors: [
        injected(),
        mock({
            accounts: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"], // Anvil Account #0 (Deployer)
        }),
    ],
    transports: {
        [anvil.id]: http(),
    },
})
