import { DashboardLayout } from '@/shared/ui/dashboard-layout'
import { MarketplaceContent } from '@/domains/marketplace/components/marketplace-content'

export default function MarketplacePage() {
  return (
    <DashboardLayout>
      <MarketplaceContent />
    </DashboardLayout>
  )
}
