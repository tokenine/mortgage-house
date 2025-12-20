import { NextResponse } from "next/server"
import path from "node:path"
import fs from "node:fs/promises"
import { createPublicClient, formatUnits, http } from "viem"
import { customChain } from '@/shared/lib/wagmi-config'
import { CONTRACTS } from '@/shared/lib/contracts'
import type { ProjectOnChainMetadata } from "@/types/project"

// Lightweight runtime validation without extra deps
function isValidProject(obj: any): boolean {
  return (
    obj &&
    (typeof obj.id === "string" || typeof obj.id === "number") &&
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

async function fetchStatsForProject(client: any, address: `0x${string}`) {
  try {
    const [fundingCapRaw, totalRaisedRaw, isFundingActiveRaw] = await Promise.all([
      client.readContract({
        address,
        abi: CONTRACTS.mortgageBond.abi,
        functionName: "FUNDING_CAP",
      }),
      client.readContract({
        address,
        abi: CONTRACTS.mortgageBond.abi,
        functionName: "totalPrincipalRaised",
      }),
      client.readContract({
        address,
        abi: CONTRACTS.mortgageBond.abi,
        functionName: "isFundingActive",
      }),
    ])

    return {
      fundingCap: Number(formatUnits(fundingCapRaw as bigint, 6)),
      totalRaised: Number(formatUnits(totalRaisedRaw as bigint, 6)),
      isFundingActive: Boolean(isFundingActiveRaw),
    }
  } catch (error) {
    console.error(`Failed to fetch on-chain stats for project ${address}:`, error)
    return null
  }
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "domains", "projects", "data", "projects.json")
    const raw = await fs.readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw)
    const projects = normalizePayload(parsed)

    const valid = projects.filter(isValidProject)
    const isPartial = valid.length !== projects.length

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || customChain.rpcUrls.default.http[0]
    const client = createPublicClient({
      chain: customChain,
      transport: http(rpcUrl),
    })

    const projectsWithOnChain = await Promise.all(
      valid.map(async (project: any) => {
        const bondAddress = project.onChain?.mortgageBondAddress as `0x${string}`
        const chainId = project.onChain?.chainId ?? customChain.id
        const decimals = project.onChain?.decimals ?? 6

        // Fetch individual stats for this project's address
        const onChain = bondAddress ? await fetchStatsForProject(client, bondAddress) : null

        const onChainMeta = {
          mortgageBondAddress: bondAddress || CONTRACTS.mortgageBond.address,
          paymentTokenAddress: project.onChain?.paymentTokenAddress || CONTRACTS.mockToken.address,
          chainId: chainId as number,
          decimals: decimals as number,
          isFundingActive: onChain?.isFundingActive ?? false,
        } satisfies ProjectOnChainMetadata

        return {
          ...project,
          fundingCap: onChain?.fundingCap ?? project.fundingCap,
          raised: onChain?.totalRaised ?? project.raised,
          onChain: onChainMeta,
        }
      })
    )

    const res = NextResponse.json(
      {
        projects: projectsWithOnChain,
        partial: isPartial,
        onChainAvailable: projectsWithOnChain.some(p => p.onChain.isFundingActive !== undefined)
      },
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
