/**
 * Stage Management Utilities
 * Epic 5.3 Stage Management System
 */

export enum Stage {
  NOT_STARTED = 0,
  FUNDING = 1,
  FUNDED = 2,
  ACTIVE = 3,
  REPAID = 4
}

export interface StageConfig {
  id: Stage
  name: string
  description: string
  color: string
  icon: string
  allowedOperations: string[]
  nextStages: Stage[]
  prevStages: Stage[]
}

export const STAGE_CONFIGS: Record<Stage, StageConfig> = {
  [Stage.NOT_STARTED]: {
    id: Stage.NOT_STARTED,
    name: 'Not Started',
    description: 'Contract has been deployed but funding has not begun',
    color: 'gray',
    icon: '📋',
    allowedOperations: ['startFunding'],
    nextStages: [Stage.FUNDING],
    prevStages: []
  },
  [Stage.FUNDING]: {
    id: Stage.FUNDING,
    name: 'Funding',
    description: 'Contract is actively seeking investor funding',
    color: 'blue',
    icon: '💰',
    allowedOperations: ['invest'],
    nextStages: [Stage.FUNDED],
    prevStages: [Stage.NOT_STARTED]
  },
  [Stage.FUNDED]: {
    id: Stage.FUNDED,
    name: 'Funded',
    description: 'Funding target has been reached, ready for loan withdrawal',
    color: 'yellow',
    icon: '✅',
    allowedOperations: ['withdrawLoan'],
    nextStages: [Stage.ACTIVE, Stage.REPAID], // Allow emergency close
    prevStages: [Stage.FUNDING]
  },
  [Stage.ACTIVE]: {
    id: Stage.ACTIVE,
    name: 'Active',
    description: 'Loan has been withdrawn, repayments in progress',
    color: 'green',
    icon: '🏠',
    allowedOperations: ['depositPrincipal', 'depositInterest'],
    nextStages: [Stage.REPAID],
    prevStages: [Stage.FUNDED]
  },
  [Stage.REPAID]: {
    id: Stage.REPAID,
    name: 'Repaid',
    description: 'Loan has been fully repaid, contract is complete',
    color: 'purple',
    icon: '🎉',
    allowedOperations: ['withdrawPayout'],
    nextStages: [],
    prevStages: [Stage.ACTIVE, Stage.FUNDED]
  }
}

/**
 * Get stage configuration by ID
 */
export function getStageConfig(stageId: number | Stage): StageConfig {
  return STAGE_CONFIGS[stageId as Stage] || STAGE_CONFIGS[Stage.NOT_STARTED]
}

/**
 * Get stage name by ID
 */
export function getStageName(stageId: number | Stage): string {
  return getStageConfig(stageId).name
}

/**
 * Get stage color for UI styling
 */
export function getStageColor(stageId: number | Stage): string {
  return getStageConfig(stageId).color
}

/**
 * Get stage icon for UI display
 */
export function getStageIcon(stageId: number | Stage): string {
  return getStageConfig(stageId).icon
}

/**
 * Check if a specific operation is allowed in the current stage
 */
export function isOperationAllowed(stageId: number | Stage, operation: string): boolean {
  const config = getStageConfig(stageId)
  return config.allowedOperations.includes(operation)
}

/**
 * Get all valid next stages from current stage
 */
export function getAllowedTransitions(stageId: number | Stage): Stage[] {
  const config = getStageConfig(stageId)
  return config.nextStages
}

/**
 * Validate if a stage transition is allowed
 */
export function validateTransition(fromStage: number | Stage, toStage: number | Stage): boolean {
  const allowed = getAllowedTransitions(fromStage)
  return allowed.includes(toStage as Stage)
}

/**
 * Get transition progress percentage (for progress bars)
 */
export function getTransitionProgress(stageId: number | Stage): number {
  // Map stages to progress percentages
  const progressMap: Record<Stage, number> = {
    [Stage.NOT_STARTED]: 0,
    [Stage.FUNDING]: 20,
    [Stage.FUNDED]: 40,
    [Stage.ACTIVE]: 60,
    [Stage.REPAID]: 100
  }

  return progressMap[stageId as Stage] || 0
}

/**
 * Format stage duration in human-readable format
 */
export function formatStageDuration(seconds: number): string {
  if (seconds === 0) return 'N/A'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Get stage description for tooltips
 */
export function getStageDescription(stageId: number | Stage): string {
  return getStageConfig(stageId).description
}

/**
 * Check if stage is a funding-related stage
 */
export function isFundingStage(stageId: number | Stage): boolean {
  return stageId === Stage.FUNDING || stageId === Stage.FUNDED
}

/**
 * Check if stage is an active loan stage
 */
export function isActiveStage(stageId: number | Stage): boolean {
  return stageId === Stage.ACTIVE || stageId === Stage.REPAID
}

/**
 * Check if stage is a terminal stage (no further transitions)
 */
export function isTerminalStage(stageId: number | Stage): boolean {
  const config = getStageConfig(stageId)
  return config.nextStages.length === 0
}

/**
 * Get stage metrics for dashboard display
 */
export function getStageMetrics(stageId: number | Stage): {
  completionPercentage: number
  status: 'pending' | 'active' | 'completed' | 'error'
  urgency: 'low' | 'medium' | 'high' | 'critical'
} {
  const config = getStageConfig(stageId)

  let status: 'pending' | 'active' | 'completed' | 'error' = 'pending'
  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low'

  switch (stageId) {
    case Stage.NOT_STARTED:
      status = 'pending'
      urgency = 'high'
      break
    case Stage.FUNDING:
      status = 'active'
      urgency = 'medium'
      break
    case Stage.FUNDED:
      status = 'active'
      urgency = 'high'
      break
    case Stage.ACTIVE:
      status = 'active'
      urgency = 'medium'
      break
    case Stage.REPAID:
      status = 'completed'
      urgency = 'low'
      break
  }

  return {
    completionPercentage: getTransitionProgress(stageId),
    status,
    urgency
  }
}

/**
 * Get CSS classes for stage badges
 */
export function getStageClasses(stageId: number | Stage): {
  badge: string
  text: string
  border: string
  background: string
} {
  const color = getStageColor(stageId)

  const colorMap: Record<string, { badge: string; text: string; border: string; background: string }> = {
    gray: {
      badge: 'bg-gray-100 text-gray-800 border-gray-300',
      text: 'text-gray-600',
      border: 'border-gray-300',
      background: 'bg-gray-50'
    },
    blue: {
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      text: 'text-blue-600',
      border: 'border-blue-300',
      background: 'bg-blue-50'
    },
    yellow: {
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      text: 'text-yellow-600',
      border: 'border-yellow-300',
      background: 'bg-yellow-50'
    },
    green: {
      badge: 'bg-green-100 text-green-800 border-green-300',
      text: 'text-green-600',
      border: 'border-green-300',
      background: 'bg-green-50'
    },
    purple: {
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      text: 'text-purple-600',
      border: 'border-purple-300',
      background: 'bg-purple-50'
    }
  }

  return colorMap[color] || colorMap.gray
}

/**
 * Validate stage parameters for form inputs
 */
export function validateStageParams(params: {
  newStage: number
  reason: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate stage number
  if (!Object.values(Stage).includes(params.newStage)) {
    errors.push('Invalid stage number')
  }

  // Validate reason
  if (!params.reason || params.reason.trim().length === 0) {
    errors.push('Reason is required')
  } else if (params.reason.length < 10) {
    errors.push('Reason must be at least 10 characters')
  } else if (params.reason.length > 500) {
    errors.push('Reason must not exceed 500 characters')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get default stage transition reasons
 */
export function getDefaultTransitionReasons(fromStage: Stage, toStage: Stage): string[] {
  const reasonMap: Record<string, string[]> = {
    '0-1': ['Starting funding phase', 'Ready to accept investments'],
    '1-2': ['Funding target reached', 'Investment goal completed', 'Maximum funding achieved'],
    '2-3': ['Loan fully withdrawn to borrower', 'All funds disbursed', 'Borrower funded'],
    '3-4': ['Loan fully repaid by borrower', 'All payments completed', 'Mortgage satisfied'],
    '2-4': ['Emergency closure', 'Special circumstances', 'Contract cancellation']
  }

  return reasonMap[`${fromStage}-${toStage}`] || ['Manual stage transition']
}

/**
 * Export stage constants and utilities
 */
export {
  Stage,
  STAGE_CONFIGS
}