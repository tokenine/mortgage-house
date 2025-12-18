"use client"

import { useState, useEffect } from "react"

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Wallet, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function WalletConnect() {
    const { address, isConnected, chain } = useAccount()
    const { connectors, connect, error, isPending } = useConnect()
    const { disconnect } = useDisconnect()
    const { switchChain } = useSwitchChain()
    const [mounted, setMounted] = useState(false)
    const [showConnectModal, setShowConnectModal] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <Button disabled>Connect Wallet</Button>
    }

    if (isConnected) {
        const isCorrectChain = chain?.id === 7117 || chain?.id === 31337 // Custom testnet or Anvil
        
        return (
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Connected</span>
                        {isCorrectChain ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    {!isCorrectChain && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => switchChain({ chainId: 7117 })}
                            className="text-xs text-yellow-500 hover:text-yellow-600"
                        >
                            Switch to Custom Testnet
                        </Button>
                    )}
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
        <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
            <DialogTrigger asChild>
                <Button>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Connect Your Wallet</DialogTitle>
                    <DialogDescription>
                        Choose a wallet to connect to the Mortgage Bond Marketplace
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error.message}</AlertDescription>
                        </Alert>
                    )}
                    <div className="grid gap-2">
                        {uniqueConnectors.map((connector) => {
                            const isMock = connector.name === 'Mock'
                            return (
                                <Button
                                    key={connector.uid}
                                    onClick={() => {
                                        connect({ connector })
                                        setShowConnectModal(false)
                                    }}
                                    variant={isMock ? "secondary" : "default"}
                                    className={isMock ? "" : "bg-orange-600 hover:bg-orange-700 text-white"}
                                    disabled={isPending}
                                >
                                    {isMock ? "Connect Admin" : (connector.name === 'Injected' ? 'Connect MetaMask' : `Connect ${connector.name}`)}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
