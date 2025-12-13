import { NextResponse } from "next/server"
import path from "node:path"
import fs from "node:fs/promises"
import { createPublicClient, formatUnits, http } from "viem"
import { customChain } from "@/lib/wagmi-config"
import { CONTRACTS } from "@/lib/contracts"
import type { ProjectOnChainMetadata } from "@/types/project"

// Lightweight runtime validation without extra deps
function isValidProject(obj: any): boolean {
  return (
    obj &&
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.location === "string" &&
    typeof obj.apy === "number" &&
    typeof obj.fundingCap === "number" &&
    typeof obj.raised === "number" &&
    typeof obj.maturity === "string" &&
    typeof obj.investors === "number" &&
    typeof obj.image === "string"
  )
}

function normalizePayload(json: any) {
  if (Array.isArray(json)) return json
  if (json && Array.isArray(json.projects)) return json.projects
  return []
}

async function fetchOnChainStats() {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || customChain.rpcUrls.default.http[0]

    const client = createPublicClient({
      chain: customChain,
      transport: http(rpcUrl),
    })

    // Use individual contract reads instead of multicall to avoid multicall3 dependency
    const [fundingCapRaw, totalRaisedRaw, isFundingActiveRaw] = await Promise.all([
      client.readContract({
        ...CONTRACTS.mortgageBond,
        functionName: "FUNDING_CAP",
      }),
      client.readContract({
        ...CONTRACTS.mortgageBond,
        functionName: "totalPrincipalRaised",
      }),
      client.readContract({
        ...CONTRACTS.mortgageBond,
        functionName: "isFundingActive",
      }),
    ])

    const fundingCap = fundingCapRaw ? Number(formatUnits(fundingCapRaw as bigint, 6)) : undefined
    const totalRaised = totalRaisedRaw ? Number(formatUnits(totalRaisedRaw as bigint, 6)) : undefined
    const isFundingActive = Boolean(isFundingActiveRaw)

    return { fundingCap, totalRaised, isFundingActive }
  } catch (error) {
    console.error("Failed to fetch on-chain project stats", error)
    return null
  }
}

export async function GET() {
  try {
    // Correct path: process.cwd() in the frontend app is .../frontend
    const filePath = path.join(process.cwd(), "data", "projects.json")

    const raw = await fs.readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw)
    const projects = normalizePayload(parsed)

    const valid = projects.filter(isValidProject)
    const isPartial = valid.length !== projects.length

    const onChain = await fetchOnChainStats()

    const projectsWithOnChain = valid.map((project) => {
      const onChainMeta: ProjectOnChainMetadata = {
        mortgageBondAddress: CONTRACTS.mortgageBond.address,
        paymentTokenAddress: CONTRACTS.mockToken.address,
        chainId: project.onChain?.chainId || customChain.id,
        decimals: project.onChain?.decimals || 6,
        isFundingActive: onChain?.isFundingActive,
      }

      return {
        ...project,
        fundingCap: onChain?.fundingCap ?? project.fundingCap,
        raised: onChain?.totalRaised ?? project.raised,
        onChain: onChainMeta,
      }
    })

    const res = NextResponse.json(
      { projects: projectsWithOnChain, partial: isPartial, onChainAvailable: Boolean(onChain) },
      { status: 200 }
    )
    res.headers.set("Cache-Control", "no-store")
    return res
  } catch (err: any) {
    const res = NextResponse.json(
      {
        error: "Failed to load projects",
        message: typeof err?.message === "string" ? err.message : "Unexpected error",
      },
      { status: 500 }
    )
    res.headers.set("Cache-Control", "no-store")
    return res
  }
}
