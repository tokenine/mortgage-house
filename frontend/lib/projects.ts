import projectsData from "@/data/projects.json"
import mortgageBondAbi from "./abis/MortgageBond.json"
import mockErc20Abi from "./abis/MockERC20.json"

export type Project = (typeof projectsData.projects)[number]

/**
 * Get all projects
 */
export function getAllProjects(): Project[] {
  return projectsData.projects
}

/**
 * Get a single project by slug ID
 */
export function getProject(id: string): Project {
  const project = projectsData.projects.find((p) => p.id === id)
  if (!project) {
    throw new Error(`Project with id "${id}" not found`)
  }
  return project
}

/**
 * Get the first project (default for MVP single-project mode)
 */
export function getDefaultProject(): Project {
  if (projectsData.projects.length === 0) {
    throw new Error("No projects available")
  }
  return projectsData.projects[0]
}

/**
 * Find a project by its mortgage bond contract address and chain ID
 */
export function findProjectByAddress(
  chainId: number,
  mortgageBondAddress: string
): Project | undefined {
  return projectsData.projects.find(
    (p) =>
      p.onChain?.chainId === chainId &&
      p.onChain?.mortgageBondAddress?.toLowerCase() === mortgageBondAddress.toLowerCase()
  )
}

/**
 * Get mortgage bond contract configuration for a project
 */
export function getMortgageBondConfig(id: string) {
  const project = getProject(id)
  const onChain = project.onChain

  if (!onChain?.mortgageBondAddress || !onChain.chainId) {
    throw new Error(`Project "${id}" missing mortgage bond contract configuration`)
  }

  return {
    address: onChain.mortgageBondAddress as `0x${string}`,
    chainId: onChain.chainId,
    abi: mortgageBondAbi.abi,
  }
}

/**
 * Get payment token contract configuration for a project
 */
export function getPaymentTokenConfig(id: string) {
  const project = getProject(id)
  const onChain = project.onChain

  if (!onChain?.paymentTokenAddress || !onChain.decimals) {
    throw new Error(`Project "${id}" missing payment token contract configuration`)
  }

  return {
    address: onChain.paymentTokenAddress as `0x${string}`,
    chainId: onChain.chainId,
    decimals: onChain.decimals,
    abi: mockErc20Abi.abi,
  }
}

/**
 * Validate that a project has complete onChain configuration
 */
export function validateProjectConfig(id: string): boolean {
  try {
    const project = getProject(id)
    return !!(
      project.onChain?.mortgageBondAddress &&
      project.onChain?.paymentTokenAddress &&
      project.onChain?.chainId &&
      project.onChain?.decimals
    )
  } catch {
    return false
  }
}
