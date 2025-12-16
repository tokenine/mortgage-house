"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Building2, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { useMortgageBond } from "@/shared/hooks/useMortgageBond"
import { usePortfolio } from '@/domains/investment/hooks/usePortfolio'
import { getProjectById } from '@/domains/projects/lib/projects'

export default function BondDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  const { address } = useAccount()
  const { portfolio } = usePortfolio()
  
  // Get project data
  const project = getProjectById(projectId)
  
  // Get contract data for this specific bond
  const {
    totalRaised,
    fundingCap,
    isFundingActive,
    investorInfo,
    pendingRewards,
  } = useMortgageBond(projectId)

  // Get user's investment in this bond
  const userInvestment = portfolio.investments.find(inv => inv.projectId === projectId)

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Bond not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const fundingProgress = fundingCap ? (Number(totalRaised) / Number(fundingCap)) * 100 : 0
  const isFullyFunded = fundingProgress >= 100

  // Determine bond stage
  const getBondStage = () => {
    if (isFundingActive && !isFullyFunded) {
      return { name: "Funding", color: "bg-blue-500", icon: Clock }
    } else if (isFullyFunded || !isFundingActive) {
      return { name: "Active", color: "bg-green-500", icon: CheckCircle2 }
    }
    return { name: "Funding", color: "bg-blue-500", icon: Clock }
  }

  const stage = getBondStage()
  const StageIcon = stage.icon

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Bond Header */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <img 
                  src={project.image || "/placeholder.svg"} 
                  alt={project.name}
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">{project.name}</h1>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {project.location}
                      </p>
                    </div>
                    <Badge className={`${stage.color} text-white`}>
                      <StageIcon className="mr-1 h-3 w-3" />
                      {stage.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bond Stage Progress */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Bond Lifecycle</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track the status and progress of this bond
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                
                {/* Stage 1: Funding */}
                <div className="relative flex gap-4 pb-8">
                  <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                    stage.name === "Funding" || stage.name === "Active" ? "bg-green-500" : "bg-muted"
                  }`}>
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-foreground">Funding Stage</h3>
                    <p className="text-sm text-muted-foreground">
                      Accepting investments • Target: ${fundingCap ? (Number(fundingCap) / 1e6).toLocaleString() : '0'}
                    </p>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{fundingProgress.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage 2: Active */}
                <div className="relative flex gap-4 pb-8">
                  <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                    stage.name === "Active" ? "bg-green-500" : "bg-muted"
                  }`}>
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-foreground">Active Stage</h3>
                    <p className="text-sm text-muted-foreground">
                      Bond is active • Earning {project.apy}% APY
                    </p>
                    {stage.name === "Active" && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-success">
                        <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
                        Currently Active
                      </div>
                    )}
                  </div>
                </div>

                {/* Stage 3: Matured (Future) */}
                <div className="relative flex gap-4">
                  <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-foreground">Maturity</h3>
                    <p className="text-sm text-muted-foreground">
                      Expected: {project.maturity}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bond Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Bond Information</CardTitle>
              <CardDescription className="text-muted-foreground">
                Key details and terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">APY</p>
                  <p className="text-2xl font-bold text-foreground">{project.apy}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Maturity Date</p>
                  <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {project.maturity}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Raised</p>
                  <p className="text-lg font-semibold text-foreground">
                    ${totalRaised ? (Number(totalRaised) / 1e6).toLocaleString() : '0'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Investors</p>
                  <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {project.investors || 0}
                  </p>
                </div>
              </div>

              {project.description && (
                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* User's Position */}
          {address ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Your Position</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your investment in this bond
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolio.isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : userInvestment ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Shares Owned</span>
                        <span className="text-lg font-bold text-foreground">
                          {userInvestment.shares ? (Number(userInvestment.shares) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current Value</span>
                        <span className="text-lg font-bold text-foreground">
                          ${userInvestment.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <span className="text-sm text-muted-foreground">Unclaimed Yield</span>
                        <span className="text-lg font-bold text-success">
                          +${userInvestment.yield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">You don't own shares in this bond yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to view your position
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Loan Amount
                </span>
                <span className="font-semibold text-foreground">
                  ${project.loanAmount?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Interest Rate
                </span>
                <span className="font-semibold text-foreground">
                  {project.interestRate || 'N/A'}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Loan Term
                </span>
                <span className="font-semibold text-foreground">
                  {project.loanTerm || 'N/A'} months
                </span>
              </div>
              {project.riskRating && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Risk Rating</span>
                  <Badge variant="outline">{project.riskRating}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
