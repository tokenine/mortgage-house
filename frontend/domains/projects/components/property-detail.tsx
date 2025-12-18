"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount, useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorMessage } from "@/components/ui/error-message"
import { MapPin, TrendingUp, Users, Calendar, DollarSign, Shield, Home, Percent } from "lucide-react"
import { useProjects } from '@/domains/projects/hooks/useProjects'
import { usePortfolio } from '@/domains/investment/hooks/usePortfolio'
import { InvestmentForm } from '@/domains/investment/components/investment-form'
import { getPaymentTokenConfig } from '@/domains/projects/lib/projects'
import { useMortgageBond } from "@/shared/hooks/useMortgageBond"
import type { MortgageProject } from "@/types/project"

interface PropertyDetailProps {
  id: string
}

export function PropertyDetail({ id }: PropertyDetailProps) {
  const router = useRouter()
  const { projects, loading, error, refetch } = useProjects()
  const { onInvestmentSuccess } = usePortfolio()
  const { isConnected, address } = useAccount()
  const [project, setProject] = useState<MortgageProject | null>(null)
  
  // Pass the project ID to useMortgageBond so it fetches the correct contract
  const projectId = project?.id ? (typeof project.id === 'string' ? project.id : String(project.id)) : id
  const { fundingCap, totalRaised, isFundingActive } = useMortgageBond(projectId)
  
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0))
  const [debugInfo, setDebugInfo] = useState<{ error: string; details: string } | null>(null)

  // Get payment token config (will use first project initially, updated when project loads)
  const paymentTokenConfig = projectId ? getPaymentTokenConfig(projectId) : null

  // Fetch user's USDT token balance
  const { data: balanceData } = useReadContract({
    address: paymentTokenConfig?.address,
    abi: paymentTokenConfig?.abi,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: isConnected && !!address && !!paymentTokenConfig,
    },
  })

  useEffect(() => {
    try {
      if (balanceData !== undefined) {
        const parsed = typeof balanceData === "bigint" ? balanceData : BigInt(balanceData as string | number)
        setUserBalance(parsed)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setDebugInfo({
        error: "Failed to parse balance data",
        details: errorMsg,
      })
      console.error("Balance parsing error:", err)
    }
  }, [balanceData])

  useEffect(() => {
    try {
      if (!loading && projects.length > 0) {
        // ID is now a slug like "modern-apartment-austin"
        const found = projects.find((p) => String(p.id) === id)
        if (!found) {
          // Project not found, redirect to 404
          console.warn(`Project with ID ${id} not found. Available IDs:`, projects.map(p => p.id))
          router.push("/404")
        } else {
          setProject(found)
          setDebugInfo(null) // Clear debug info on success
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setDebugInfo({
        error: "Failed to load project",
        details: errorMsg,
      })
      console.error("Project loading error:", err)
    }
  }, [projects, loading, id, router])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || debugInfo) {
    const errorMessage = debugInfo?.error || error
    const errorDetails = debugInfo?.details
    
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Error Loading Project</CardTitle>
          <CardDescription className="text-muted-foreground">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorDetails && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm">
              <p className="font-mono text-xs text-destructive">{errorDetails}</p>
            </div>
          )}
          <ErrorMessage
            message={errorMessage || "An unexpected error occurred"}
            onRetry={refetch}
          />
        </CardContent>
      </Card>
    )
  }

  if (!project) {
    return (
      <ErrorMessage
        title="Project Not Found"
        message="The requested mortgage project could not be found."
      />
    )
  }

  const onChainFundingCap = fundingCap ? Number(formatUnits(fundingCap as bigint, 6)) : project.fundingCap
  const onChainRaised = totalRaised ? Number(formatUnits(totalRaised as bigint, 6)) : project.raised
  const fundingPercentage = onChainFundingCap > 0 ? (onChainRaised / onChainFundingCap) * 100 : 0
  const remaining = Math.max(onChainFundingCap - onChainRaised, 0)
  const fundingActive = isFundingActive === undefined ? true : Boolean(isFundingActive)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{project.location}</span>
            </div>
          </div>
          <Badge className="bg-success text-success-foreground text-lg px-4 py-2">
            {project.apy}% APY
          </Badge>
        </div>

        {/* Property Image */}
        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-muted">
          <img 
            src={project.image || "/placeholder.svg"} 
            alt={project.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Funding Progress */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Funding Progress</CardTitle>
          <CardDescription className="text-muted-foreground">
            ${remaining.toLocaleString()} remaining of ${onChainFundingCap.toLocaleString()} funding cap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{fundingPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={fundingPercentage} className="h-3" />
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">
                ${onChainRaised.toLocaleString()} raised
              </span>
              <span className="text-muted-foreground">
                {project.investors} investors
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Loan Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${project.loanAmount?.toLocaleString() || project.fundingCap.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interest Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {project.interestRate || project.apy}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Loan Term</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {project.loanTerm ? `${project.loanTerm} mo` : project.maturity}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risk Rating</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {project.riskRating || "A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Details */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.description && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Description</h3>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {project.propertyValue && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Property Value</h4>
                <p className="text-lg font-semibold text-foreground">
                  ${project.propertyValue.toLocaleString()}
                </p>
              </div>
            )}

            {project.loanToValue && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Loan-to-Value</h4>
                <p className="text-lg font-semibold text-foreground">
                  {project.loanToValue}%
                </p>
              </div>
            )}

            {project.borrowerType && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Borrower Type</h4>
                <p className="text-lg font-semibold text-foreground">
                  {project.borrowerType}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Maturity</h4>
              <p className="text-lg font-semibold text-foreground">
                {project.maturity}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Form Section */}
      {isConnected ? (
        <InvestmentForm
          project={project}
          userBalance={userBalance}
          fundingCap={onChainFundingCap}
          totalRaised={onChainRaised}
          isFundingActive={fundingActive}
          onInvestmentSuccess={onInvestmentSuccess}
        />
      ) : (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Connect Your Wallet</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please connect your wallet to invest in this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorMessage
              message="Wallet not connected. Please connect your wallet using the button in the top right corner."
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
