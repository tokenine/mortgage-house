import { InvestCard } from "@/components/InvestCard"
import { UserDashboard } from "@/components/UserDashboard"
import { WalletConnect } from "@/components/WalletConnect"
import { MarketList } from "@/components/MarketList"
import { SellModal } from "@/components/SellModal"
import { AdminPanel } from "@/components/AdminPanel"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Mortgage Bond Marketplace</h1>
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
