import { DashboardLayout } from "@/components/dashboard-layout"
import { PropertyDetail } from "@/components/property-detail"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

async function MortgageDetailContent({ id }: { id: string }) {
  return (
    <PropertyDetail id={id} />
  )
}

export default async function MortgageDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      }>
        <MortgageDetailContent id={id} />
      </Suspense>
    </DashboardLayout>
  )
}
