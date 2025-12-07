"use client"

import { useState, useEffect } from "react"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"

export function WalletConnect() {
    const { address, isConnected } = useAccount()
    const { connectors, connect, error } = useConnect()
    const { disconnect } = useDisconnect()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <Button disabled>Connect Wallet</Button>
    }

    if (isConnected) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">Connected</span>
                    <span className="text-xs text-muted-foreground font-mono">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => disconnect()}>
                    Disconnect
                </Button>
            </div>
        )
    }

    // Filter unique connectors to avoid duplicates (e.g. Injected + MetaMask)
    const uniqueConnectors = connectors.filter((c, index, self) =>
        index === self.findIndex((t) => t.id === c.id || t.name === c.name)
    )

    return (
        <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
                {uniqueConnectors.map((connector) => {
                    const isMock = connector.name === 'Mock'
                    return (
                        <Button
                            key={connector.uid}
                            onClick={() => connect({ connector })}
                            variant={isMock ? "secondary" : "default"}
                            className={isMock ? "" : "bg-orange-600 hover:bg-orange-700 text-white"}
                        >
                            {isMock ? "Connect Admin" : (connector.name === 'Injected' ? 'Connect MetaMask' : `Connect ${connector.name}`)}
                        </Button>
                    )
                })}
            </div>
            {error && <span className="text-xs text-red-500">{error.message}</span>}
        </div>
    )
}
