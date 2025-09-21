import { describe, it, expect } from 'vitest'
import {
  randomBetween,
  rollDice,
  getDiceResult,
  getDiceEmoji,
  formatCurrency,
  generateMockAddress,
  generateMockHash,
} from '../src/lib/utils'

describe('Utils', () => {
  describe('randomBetween', () => {
    it('generates number within range', () => {
      const result = randomBetween(1, 6)
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(6)
    })
  })

  describe('rollDice', () => {
    it('generates dice roll between 1-6', () => {
      const result = rollDice()
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(6)
    })
  })

  describe('getDiceResult', () => {
    it('returns high for 4-6', () => {
      expect(getDiceResult(4)).toBe('high')
      expect(getDiceResult(5)).toBe('high')
      expect(getDiceResult(6)).toBe('high')
    })

    it('returns low for 1-3', () => {
      expect(getDiceResult(1)).toBe('low')
      expect(getDiceResult(2)).toBe('low')
      expect(getDiceResult(3)).toBe('low')
    })
  })

  describe('getDiceEmoji', () => {
    it('returns correct emoji for each number', () => {
      expect(getDiceEmoji(1)).toBe('⚀')
      expect(getDiceEmoji(2)).toBe('⚁')
      expect(getDiceEmoji(3)).toBe('⚂')
      expect(getDiceEmoji(4)).toBe('⚃')
      expect(getDiceEmoji(5)).toBe('⚄')
      expect(getDiceEmoji(6)).toBe('⚅')
    })

    it('returns default emoji for invalid input', () => {
      expect(getDiceEmoji(0)).toBe('🎲')
      expect(getDiceEmoji(7)).toBe('🎲')
    })
  })

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000')
      expect(formatCurrency(25.5)).toBe('$25.5') // formatCurrency doesn't add trailing zeros
      expect(formatCurrency(0)).toBe('$0')
    })
  })

  describe('generateMockAddress', () => {
    it('generates valid mock address', () => {
      const address = generateMockAddress()
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })
  })

  describe('generateMockHash', () => {
    it('generates consistent hash for same inputs', () => {
      const hash1 = generateMockHash('server', 'client', 1)
      const hash2 = generateMockHash('server', 'client', 1)
      expect(hash1).toBe(hash2)
    })

    it('generates different hash for different inputs', () => {
      const hash1 = generateMockHash('server1', 'client', 1)
      const hash2 = generateMockHash('server2', 'client', 1)
      expect(hash1).not.toBe(hash2)
    })
  })
})
