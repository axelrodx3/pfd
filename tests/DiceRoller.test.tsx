import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DiceRoller from '../src/components/DiceRoller'
import { useGameStore } from '../src/store/gameStore'

// Mock the store
vi.mock('../src/store/gameStore', () => ({
  useGameStore: vi.fn(),
}))

describe('DiceRoller', () => {
  const mockStore = {
    lastRoll: null,
    isRolling: false,
    lastResult: null,
    lastWin: null,
  }

  beforeEach(() => {
    vi.mocked(useGameStore).mockReturnValue(mockStore)
  })

  it('renders dice roller component', () => {
    render(<DiceRoller />)
    expect(screen.getByText('🎲')).toBeInTheDocument()
  })

  it('shows rolling state when isRolling is true', () => {
    vi.mocked(useGameStore).mockReturnValue({
      ...mockStore,
      isRolling: true,
    })

    render(<DiceRoller />)
    expect(screen.getByText('Rolling...')).toBeInTheDocument()
  })

  it('shows win result when lastWin is true', () => {
    vi.mocked(useGameStore).mockReturnValue({
      ...mockStore,
      lastRoll: 2,
      lastResult: 'low',
      lastWin: true,
    })

    render(<DiceRoller />)
    expect(screen.getByText('🎉 YOU WIN!')).toBeInTheDocument()
    expect(screen.getByText('Rolled: 2 (LOW)')).toBeInTheDocument()
  })

  it('shows lose result when lastWin is false', () => {
    vi.mocked(useGameStore).mockReturnValue({
      ...mockStore,
      lastRoll: 5,
      lastResult: 'high',
      lastWin: false,
    })

    render(<DiceRoller />)
    expect(screen.getByText('💸 YOU LOSE!')).toBeInTheDocument()
    expect(screen.getByText('Rolled: 5 (HIGH)')).toBeInTheDocument()
  })
})
