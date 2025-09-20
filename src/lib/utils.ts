import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random number between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a random dice roll (1-6)
 * @returns Random dice number
 */
export function rollDice(): number {
  return randomBetween(1, 6)
}

/**
 * Check if a dice roll is high (4-6) or low (1-3)
 * @param diceRoll - The dice roll result
 * @returns 'high' or 'low'
 */
export function getDiceResult(diceRoll: number): 'high' | 'low' {
  return diceRoll >= 4 ? 'high' : 'low'
}

/**
 * Get dice emoji for a given number
 * @param number - Dice number (1-6)
 * @returns Dice emoji
 */
export function getDiceEmoji(number: number): string {
  const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
  return diceEmojis[number - 1] || '🎲'
}

/**
 * Format currency amount
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Generate a mock wallet address
 * @returns Mock wallet address
 */
export function generateMockAddress(): string {
  const chars = '0123456789ABCDEF'
  let result = '0x'
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate a mock hash for provably fair verification
 * @param serverSeed - Server seed
 * @param clientSeed - Client seed
 * @param nonce - Nonce value
 * @returns Mock hash
 */
export function generateMockHash(serverSeed: string, clientSeed: string, nonce: number): string {
  const message = `${serverSeed}:${clientSeed}:${nonce}`
  // Simple hash simulation (not cryptographically secure)
  let hash = 0
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * Generate a random server seed
 * @returns Random server seed
 */
export function generateServerSeed(): string {
  const chars = '0123456789ABCDEF'
  let result = ''
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate a random client seed
 * @returns Random client seed
 */
export function generateClientSeed(): string {
  const chars = '0123456789ABCDEF'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Debounce function to limit function calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
