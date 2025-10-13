/**
 * Blockchain Certificate Verification System
 * Uses a simple blockchain-like structure with cryptographic hashing
 * for immutable certificate verification
 */

import crypto from 'crypto'
import { redis } from './redis'

export interface CertificateBlock {
  index: number
  timestamp: number
  certificateData: {
    userId: string
    moduleId: string
    skill: string
    level: string
    score?: number
    issuedAt: string
  }
  previousHash: string
  hash: string
  nonce: number
}

export class CertificateBlockchain {
  private static readonly DIFFICULTY = 2 // Number of leading zeros required
  private static readonly CHAIN_KEY = 'blockchain:certificates'

  /**
   * Calculate SHA-256 hash of block data
   */
  private static calculateHash(
    index: number,
    timestamp: number,
    data: any,
    previousHash: string,
    nonce: number
  ): string {
    return crypto
      .createHash('sha256')
      .update(index + timestamp + JSON.stringify(data) + previousHash + nonce)
      .digest('hex')
  }

  /**
   * Mine a new block (Proof of Work)
   */
  private static mineBlock(
    index: number,
    timestamp: number,
    data: any,
    previousHash: string
  ): CertificateBlock {
    let nonce = 0
    let hash = ''

    // Mine until we find a hash with required difficulty
    do {
      nonce++
      hash = this.calculateHash(index, timestamp, data, previousHash, nonce)
    } while (!hash.startsWith('0'.repeat(this.DIFFICULTY)))

    return {
      index,
      timestamp,
      certificateData: data,
      previousHash,
      hash,
      nonce,
    }
  }

  /**
   * Create genesis block (first block in chain)
   */
  private static createGenesisBlock(): CertificateBlock {
    return this.mineBlock(
      0,
      Date.now(),
      { userId: 'genesis', moduleId: 'genesis', skill: 'genesis', level: 'genesis', issuedAt: new Date().toISOString() },
      '0'
    )
  }

  /**
   * Get the blockchain from Redis
   */
  static async getChain(): Promise<CertificateBlock[]> {
    try {
      const chain = await redis.get(this.CHAIN_KEY)
      if (!chain || !Array.isArray(chain)) {
        // Initialize with genesis block
        const genesisBlock = this.createGenesisBlock()
        await redis.set(this.CHAIN_KEY, JSON.stringify([genesisBlock]))
        return [genesisBlock]
      }
      return typeof chain === 'string' ? JSON.parse(chain) : chain
    } catch (error) {
      console.error('Error getting blockchain from Redis:', error)
      // Fallback to genesis block
      const genesisBlock = this.createGenesisBlock()
      return [genesisBlock]
    }
  }

  /**
   * Get the latest block in the chain
   */
  static async getLatestBlock(): Promise<CertificateBlock> {
    const chain = await this.getChain()
    return chain[chain.length - 1]
  }

  /**
   * Add a new certificate to the blockchain
   */
  static async addCertificate(certificateData: {
    userId: string
    moduleId: string
    skill: string
    level: string
    score?: number
    issuedAt: string
  }): Promise<CertificateBlock> {
    try {
      const chain = await this.getChain()
      const latestBlock = chain[chain.length - 1]

      const newBlock = this.mineBlock(
        latestBlock.index + 1,
        Date.now(),
        certificateData,
        latestBlock.hash
      )

      chain.push(newBlock)
      await redis.set(this.CHAIN_KEY, JSON.stringify(chain))

      console.log('Certificate added to blockchain:', newBlock.hash)
      return newBlock
    } catch (error) {
      console.error('Error adding certificate to blockchain:', error)
      throw new Error('Failed to add certificate to blockchain')
    }
  }

  /**
   * Verify a certificate by hash
   */
  static async verifyCertificate(certificateHash: string): Promise<{
    isValid: boolean
    block?: CertificateBlock
    message: string
  }> {
    try {
      const chain = await this.getChain()
      
      // Find the block with matching hash
      const block = chain.find(b => b.hash === certificateHash)
      
      if (!block) {
        return {
          isValid: false,
          message: 'Certificate not found in blockchain'
        }
      }

      // Verify the block's hash
      const calculatedHash = this.calculateHash(
        block.index,
        block.timestamp,
        block.certificateData,
        block.previousHash,
        block.nonce
      )

      if (calculatedHash !== block.hash) {
        return {
          isValid: false,
          block,
          message: 'Certificate hash is invalid (tampered)'
        }
      }

      // Verify chain integrity from genesis to this block
      for (let i = 1; i <= block.index; i++) {
        const currentBlock = chain[i]
        const previousBlock = chain[i - 1]

        // Verify current block hash
        const currentCalculatedHash = this.calculateHash(
          currentBlock.index,
          currentBlock.timestamp,
          currentBlock.certificateData,
          currentBlock.previousHash,
          currentBlock.nonce
        )

        if (currentCalculatedHash !== currentBlock.hash) {
          return {
            isValid: false,
            block,
            message: `Chain integrity compromised at block ${i}`
          }
        }

        // Verify link to previous block
        if (currentBlock.previousHash !== previousBlock.hash) {
          return {
            isValid: false,
            block,
            message: `Chain link broken at block ${i}`
          }
        }
      }

      return {
        isValid: true,
        block,
        message: 'Certificate is valid and verified on blockchain'
      }
    } catch (error) {
      console.error('Error verifying certificate:', error)
      return {
        isValid: false,
        message: 'Error during verification process'
      }
    }
  }

  /**
   * Get all certificates for a user
   */
  static async getUserCertificates(userId: string): Promise<CertificateBlock[]> {
    try {
      const chain = await this.getChain()
      return chain.filter(block => block.certificateData.userId === userId && block.index > 0)
    } catch (error) {
      console.error('Error getting user certificates:', error)
      return []
    }
  }

  /**
   * Validate entire blockchain integrity
   */
  static async validateChain(): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const chain = await this.getChain()
      const errors: string[] = []

      for (let i = 1; i < chain.length; i++) {
        const currentBlock = chain[i]
        const previousBlock = chain[i - 1]

        // Verify current block hash
        const calculatedHash = this.calculateHash(
          currentBlock.index,
          currentBlock.timestamp,
          currentBlock.certificateData,
          currentBlock.previousHash,
          currentBlock.nonce
        )

        if (calculatedHash !== currentBlock.hash) {
          errors.push(`Block ${i} has invalid hash`)
        }

        // Verify link to previous block
        if (currentBlock.previousHash !== previousBlock.hash) {
          errors.push(`Block ${i} link to previous block is broken`)
        }

        // Verify proof of work
        if (!currentBlock.hash.startsWith('0'.repeat(this.DIFFICULTY))) {
          errors.push(`Block ${i} does not meet difficulty requirement`)
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    } catch (error) {
      console.error('Error validating blockchain:', error)
      return {
        isValid: false,
        errors: ['Error during blockchain validation']
      }
    }
  }
}
