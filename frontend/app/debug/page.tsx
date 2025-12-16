import { InvestCard } from '@/domains/investment/components/InvestCard'
import { UserDashboard } from '@/shared/ui/UserDashboard'
import { WalletConnect } from '@/shared/ui/WalletConnect'
import { MarketList } from '@/domains/marketplace/components/MarketList'
import { SellModal } from '@/domains/marketplace/components/SellModal'
import { AdminPanel } from '@/domains/admin/components/AdminPanel'

export default function DebugPage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <h1 className="text-xl font-bold">Mortgage Bond Marketplace (Debug)</h1>
                    <WalletConnect />
                </div>
            </header>

            <main className="container mx-auto py-8 space-y-8 px-4">
                <section>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">My Portfolio</h2>
                    <UserDashboard />
                </section>

                <section className="grid gap-8 md:grid-cols-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Primary Market</h2>
                        <InvestCard />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold tracking-tight">Secondary Market</h2>
                            {/* Sell Modal Logic: Only show if user has shares? For MVP always show */}
                            <SellModal />
                        </div>
                        <MarketList />
                    </div>
                </section>

                <section>
                    <AdminPanel />
                </section>
            </main>
        </div>
    )
}
