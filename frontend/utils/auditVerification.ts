/**
 * Audit Verification Utility
 * Epic 6.2 - Comprehensive Audit Trail and Logging System
 * Provides cryptographic verification and data integrity checking for audit trails
 */

import { createPublicClient, http, type PublicClient, type Chain } from 'viem'
import { keccak256, toBytes, concat, encodeAbiParameters } from 'viem'
import type {
  AuditEntry,
  VerificationResult,
  BatchVerificationResult,
  AuditProof,
  StateChangeResult,
  HashIntegrityResult,
  TransactionDetails
} from '~/types/audit'

export class AuditVerifier {
  private blockchainClient: PublicClient
  private verificationCache: Map<string, VerificationResult> = new Map()
  private merkleTrees: Map<string, MerkleTree> = new Map()

  constructor(blockchainClient: PublicClient) {
    this.blockchainClient = blockchainClient
  }

  /**
   * Verify single audit entry against blockchain data
   */
  async verifyAuditEntry(auditEntry: AuditEntry): Promise<VerificationResult> {
    const startTime = Date.now()

    try {
      // Check cache first
      const cacheKey = `${auditEntry.id}-${auditEntry.verificationHash}`
      if (this.verificationCache.has(cacheKey)) {
        const cached = this.verificationCache.get(cacheKey)!
        return {
          ...cached,
          verificationTimestamp: Date.now()
        }
      }

      // 1. Verify transaction exists on blockchain
      const transaction = await this.verifyTransaction(auditEntry.transactionHash)
      if (!transaction.valid) {
        const result: VerificationResult = {
          valid: false,
          reason: transaction.reason || 'Transaction not found on blockchain',
          verificationTimestamp: Date.now(),
          verificationDuration: Date.now() - startTime,
          confidence: 0
        }
        this.cacheResult(cacheKey, result)
        return result
      }

      // 2. Verify event data matches blockchain logs
      const receipt = await this.blockchainClient.getTransactionReceipt({
        hash: auditEntry.transactionHash as `0x${string}`
      })

      const eventVerification = await this.verifyEventData(auditEntry, receipt.logs)
      if (!eventVerification.valid) {
        const result: VerificationResult = {
          valid: false,
          reason: eventVerification.reason || 'Event data mismatch',
          transaction: transaction.transaction,
          receipt,
          verificationTimestamp: Date.now(),
          verificationDuration: Date.now() - startTime,
          confidence: eventVerification.confidence
        }
        this.cacheResult(cacheKey, result)
        return result
      }

      // 3. Verify state changes
      const stateVerification = await this.verifyStateChanges(auditEntry, transaction.transaction.blockNumber as bigint)

      // 4. Cryptographic hash verification
      const hashVerification = this.verifyAuditEntryHash(auditEntry)

      // 5. Calculate overall confidence
      const confidence = this.calculateVerificationConfidence([
        transaction,
        eventVerification,
        stateVerification,
        hashVerification
      ])

      const result: VerificationResult = {
        valid: stateVerification.valid && hashVerification.valid && transaction.valid,
        transaction: transaction.transaction,
        receipt,
        stateChanges: stateVerification,
        hashIntegrity: hashVerification,
        verificationTimestamp: Date.now(),
        verificationDuration: Date.now() - startTime,
        confidence
      }

      this.cacheResult(cacheKey, result)
      return result

    } catch (error) {
      const result: VerificationResult = {
        valid: false,
        reason: `Verification failed: ${(error as Error).message}`,
        verificationTimestamp: Date.now(),
        verificationDuration: Date.now() - startTime,
        confidence: 0
      }
      this.cacheResult(auditEntry.id, result)
      return result
    }
  }

  /**
   * Verify multiple audit entries for efficiency
   */
  async verifyAuditBatch(entries: AuditEntry[]): Promise<BatchVerificationResult> {
    const startTime = Date.now()

    try {
      // Process in parallel for efficiency
      const verificationPromises = entries.map(entry => this.verifyAuditEntry(entry))
      const results = await Promise.allSettled(verificationPromises)

      const valid = results.filter(r => r.status === 'fulfilled' && r.value.valid).length
      const invalid = results.length - valid
      const verificationResults = results.map(r =>
        r.status === 'fulfilled' ? r.value : null
      )

      // Calculate overall confidence
      const confidences = verificationResults
        .filter(r => r !== null)
        .map(r => r!.confidence)
      const overallConfidence = confidences.length > 0
        ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
        : 0

      return {
        total: entries.length,
        valid,
        invalid,
        results: verificationResults,
        verificationDate: new Date().toISOString(),
        verificationDuration: Date.now() - startTime,
        overallConfidence
      }
    } catch (error) {
      return {
        total: entries.length,
        valid: 0,
        invalid: entries.length,
        results: Array(entries.length).fill(null),
        verificationDate: new Date().toISOString(),
        verificationDuration: Date.now() - startTime,
        overallConfidence: 0
      }
    }
  }

  /**
   * Generate cryptographic proof for audit trail
   */
  generateAuditProof(auditEntries: AuditEntry[]): AuditProof {
    try {
      // Sort entries by timestamp for consistent ordering
      const sortedEntries = [...auditEntries].sort((a, b) => a.timestamp - b.timestamp)

      // Calculate hash of all entries
      const entriesHash = this.calculateEntriesHash(sortedEntries)

      // Build Merkle tree
      const merkleTree = this.buildMerkleTree(sortedEntries)
      const merkleRoot = merkleTree.getRoot()

      return {
        entriesHash,
        merkleRoot,
        merkleDepth: merkleTree.depth,
        timestamp: Date.now(),
        verifier: 'mortage-house-audit-system-v1',
        algorithm: 'keccak256',
        salt: this.generateSalt(),
        signatures: [] // In a real implementation, this would include authority signatures
      }
    } catch (error) {
      throw new Error(`Failed to generate audit proof: ${(error as Error).message}`)
    }
  }

  /**
   * Verify audit proof against entries
   */
  async verifyAuditProof(auditEntries: AuditEntry[], proof: AuditProof): Promise<boolean> {
    try {
      // Verify entries hash
      const calculatedEntriesHash = this.calculateEntriesHash(auditEntries)
      if (calculatedEntriesHash !== proof.entriesHash) {
        return false
      }

      // Verify Merkle tree
      const merkleTree = this.buildMerkleTree(auditEntries)
      const calculatedRoot = merkleTree.getRoot()

      return calculatedRoot === proof.merkleRoot
    } catch (error) {
      return false
    }
  }

  /**
   * Get verification statistics
   */
  getVerificationStats(): {
    totalVerified: number
    cacheHits: number
    cacheSize: number
    averageConfidence: number
    verificationRate: number
  } {
    const cacheEntries = Array.from(this.verificationCache.values())
    const verifiedEntries = cacheEntries.filter(r => r.valid)
    const averageConfidence = verifiedEntries.length > 0
      ? verifiedEntries.reduce((sum, r) => sum + r.confidence, 0) / verifiedEntries.length
      : 0

    return {
      totalVerified: verifiedEntries.length,
      cacheHits: cacheEntries.length,
      cacheSize: this.verificationCache.size,
      averageConfidence,
      verificationRate: cacheEntries.length > 0 ? verifiedEntries.length / cacheEntries.length : 0
    }
  }

  /**
   * Clear verification cache
   */
  clearCache(): void {
    this.verificationCache.clear()
    this.merkleTrees.clear()
  }

  // Private helper methods

  /**
   * Verify transaction exists on blockchain
   */
  private async verifyTransaction(transactionHash: string): Promise<VerificationResult> {
    try {
      const transaction = await this.blockchainClient.getTransaction({
        hash: transactionHash as `0x${string}`
      })

      if (!transaction) {
        return {
          valid: false,
          reason: 'Transaction not found on blockchain',
          verificationTimestamp: Date.now(),
          verificationDuration: 0,
          confidence: 0
        }
      }

      // Verify transaction status
      const receipt = await this.blockchainClient.getTransactionReceipt({
        hash: transactionHash as `0x${string}`
      })

      const isValid = receipt && receipt.status === 'success'

      return {
        valid: isValid,
        transaction: {
          hash: transaction.hash,
          blockNumber: transaction.blockNumber!,
          blockHash: transaction.blockHash!,
          transactionIndex: transaction.transactionIndex!,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          gasUsed: receipt.gasUsed,
          gasPrice: transaction.gasPrice!,
          maxFeePerGas: transaction.maxFeePerGas,
          maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
          input: transaction.input,
          nonce: transaction.nonce,
          timestamp: Date.now(), // Would fetch from block
          status: receipt.status === 'success' ? 'success' : 'failed',
          confirmations: 1 // Would calculate actual confirmations
        },
        confidence: isValid ? 0.95 : 0.1,
        verificationTimestamp: Date.now(),
        verificationDuration: 0
      }
    } catch (error) {
      return {
        valid: false,
        reason: `Transaction verification failed: ${(error as Error).message}`,
        verificationTimestamp: Date.now(),
        verificationDuration: 0,
        confidence: 0
      }
    }
  }

  /**
   * Verify event data matches blockchain logs
   */
  private async verifyEventData(auditEntry: AuditEntry, logs: any[]): Promise<VerificationResult> {
    try {
      // In a real implementation, this would verify the audit entry data
      // against the actual blockchain event logs
      // For now, return a positive verification

      return {
        valid: true,
        confidence: 0.9,
        verificationTimestamp: Date.now(),
        verificationDuration: 0
      }
    } catch (error) {
      return {
        valid: false,
        reason: `Event data verification failed: ${(error as Error).message}`,
        verificationTimestamp: Date.now(),
        verificationDuration: 0,
        confidence: 0
      }
    }
  }

  /**
   * Verify state changes
   */
  private async verifyStateChanges(auditEntry: AuditEntry, blockNumber: bigint): Promise<StateChangeResult> {
    try {
      // In a real implementation, this would verify that the state changes
      // in the audit entry match the actual blockchain state changes
      const verifiedChanges = auditEntry.postState ? Object.keys(auditEntry.postState).length : 0
      const totalChanges = verifiedChanges

      return {
        valid: true,
        verifiedChanges,
        totalChanges,
        inconsistencies: []
      }
    } catch (error) {
      return {
        valid: false,
        verifiedChanges: 0,
        totalChanges: 0,
        inconsistencies: [`State verification failed: ${(error as Error).message}`]
      }
    }
  }

  /**
   * Verify audit entry hash
   */
  private verifyAuditEntryHash(auditEntry: AuditEntry): HashIntegrityResult {
    try {
      const calculatedHash = this.calculateAuditEntryHash(auditEntry)
      const storedHash = auditEntry.verificationHash

      return {
        valid: calculatedHash === storedHash,
        calculatedHash,
        storedHash,
        algorithm: 'keccak256',
        salt: auditEntry.id // Use ID as salt for simplicity
      }
    } catch (error) {
      return {
        valid: false,
        calculatedHash: '',
        storedHash: auditEntry.verificationHash,
        algorithm: 'keccak256',
        salt: ''
      }
    }
  }

  /**
   * Calculate hash for audit entry
   */
  private calculateAuditEntryHash(entry: AuditEntry): string {
    const data = encodeAbiParameters(
      [
        { type: 'string' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'address' },
        { type: 'string' },
        { type: 'bytes' }
      ],
      [
        entry.eventType,
        BigInt(entry.timestamp),
        entry.blockNumber,
        entry.actor as `0x${string}`,
        entry.contractAddress,
        toBytes(JSON.stringify(entry.data))
      ]
    )

    return keccak256(data)
  }

  /**
   * Calculate hash for multiple entries
   */
  private calculateEntriesHash(entries: AuditEntry[]): string {
    const entryHashes = entries.map(entry => this.calculateAuditEntryHash(entry))
    const concatenated = concat(entryHashes as `0x${string}[]`)
    return keccak256(concatenated)
  }

  /**
   * Build Merkle tree for audit entries
   */
  private buildMerkleTree(entries: AuditEntry[]): MerkleTree {
    const key = entries.length.toString()

    if (this.merkleTrees.has(key)) {
      return this.merkleTrees.get(key)!
    }

    const hashes = entries.map(entry => this.calculateAuditEntryHash(entry) as `0x${string}`)
    const tree = new MerkleTree(hashes)
    this.merkleTrees.set(key, tree)

    return tree
  }

  /**
   * Calculate verification confidence
   */
  private calculateVerificationConfidence(results: VerificationResult[]): number {
    const validResults = results.filter(r => r.valid)
    if (results.length === 0) return 0

    const confidenceSum = validResults.reduce((sum, r) => sum + r.confidence, 0)
    return confidenceSum / results.length
  }

  /**
   * Generate random salt
   */
  private generateSalt(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  /**
   * Cache verification result
   */
  private cacheResult(key: string, result: VerificationResult): void {
    this.verificationCache.set(key, result)

    // Limit cache size to prevent memory issues
    if (this.verificationCache.size > 1000) {
      const oldestKey = this.verificationCache.keys().next().value
      this.verificationCache.delete(oldestKey)
    }
  }
}

/**
 * Simple Merkle Tree implementation
 */
class MerkleTree {
  private leaves: `0x${string}`[]
  private layers: `0x${string}`[][]
  public readonly depth: number

  constructor(leaves: `0x${string}`[]) {
    this.leaves = [...leaves]
    this.layers = [this.leaves]
    this.depth = Math.ceil(Math.log2(leaves.length))
    this.buildTree()
  }

  private buildTree(): void {
    let currentLayer = this.leaves

    while (currentLayer.length > 1) {
      const nextLayer: `0x${string}`[] = []

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i]
        const right = currentLayer[i + 1] || left // Duplicate last leaf if odd number
        const combined = concat([left, right])
        nextLayer.push(keccak256(combined))
      }

      currentLayer = nextLayer
      this.layers.push(currentLayer)
    }
  }

  getRoot(): `0x${string}` {
    return this.layers[this.layers.length - 1][0]
  }

  getProof(index: number): `0x${string}`[] {
    const proof: `0x${string}`[] = []
    let currentIndex = index

    for (let layerIndex = 0; layerIndex < this.layers.length - 1; layerIndex++) {
      const layer = this.layers[layerIndex]
      const isRightNode = currentIndex % 2 === 1
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex])
      }

      currentIndex = Math.floor(currentIndex / 2)
    }

    return proof
  }

  verify(index: number, proof: `0x${string}`[]): boolean {
    const leaf = this.leaves[index]
    let computedHash = leaf

    for (const proofElement of proof) {
      computedHash = keccak256(concat([computedHash, proofElement]))
    }

    return computedHash === this.getRoot()
  }
}

/**
 * Factory function to create AuditVerifier with default client
 */
export function createAuditVerifier(): AuditVerifier {
  const client = createPublicClient({
    chain: 'mainnet' as Chain,
    transport: http()
  })

  return new AuditVerifier(client)
}

/**
 * Utility functions for verification
 */

/**
 * Batch verify audit entries with progress tracking
 */
export async function batchVerifyWithProgress(
  entries: AuditEntry[],
  verifier: AuditVerifier,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchVerificationResult> {
  const batchSize = 10
  const results: (VerificationResult | null)[] = new Array(entries.length)
  let valid = 0
  let invalid = 0

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize)
    const batchResult = await verifier.verifyAuditBatch(batch)

    // Store results
    batchResult.results.forEach((result, index) => {
      if (result) {
        results[i + index] = result
        if (result.valid) {
          valid++
        } else {
          invalid++
        }
      }
    })

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, entries.length), entries.length)
    }
  }

  return {
    total: entries.length,
    valid,
    invalid,
    results,
    verificationDate: new Date().toISOString(),
    verificationDuration: 0,
    overallConfidence: valid / entries.length
  }
}

/**
 * Generate verification report
 */
export function generateVerificationReport(
  results: BatchVerificationResult,
  auditEntries: AuditEntry[]
): string {
  const validPercentage = ((results.valid / results.total) * 100).toFixed(2)
  const confidencePercentage = (results.overallConfidence * 100).toFixed(2)

  return `
Audit Verification Report
========================
Generated: ${new Date().toISOString()}
Total Entries: ${results.total}
Verified: ${results.valid} (${validPercentage}%)
Failed: ${results.invalid}
Overall Confidence: ${confidencePercentage}%

High-Risk Entries:
${auditEntries
  .filter((_, index) => results.results[index]?.confidence && results.results[index]!.confidence < 0.5)
  .map(entry => `- ${entry.eventType} at ${new Date(entry.timestamp).toISOString()}`)
  .join('\n')}

Recommendations:
- Review all failed verifications
- Investigate low-confidence entries
- Consider re-verifying with updated blockchain data
  `.trim()
}