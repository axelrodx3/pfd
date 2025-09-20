import { useEffect, useCallback } from 'react'

interface KeyboardShortcuts {
  onRollDice?: () => void
  onSelectHigh?: () => void
  onSelectLow?: () => void
  onQuickBet10?: () => void
  onQuickBet25?: () => void
  onQuickBet50?: () => void
  onQuickBet100?: () => void
  onMaxBet?: () => void
  onToggleSound?: () => void
  onToggleMute?: () => void
  onShowRules?: () => void
  onShowHistory?: () => void
  onClaimFaucet?: () => void
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return
    }

    const { key, ctrlKey, altKey, shiftKey } = event

    // Prevent default for our custom shortcuts
    const preventDefault = () => {
      event.preventDefault()
      event.stopPropagation()
    }

    switch (key.toLowerCase()) {
      case 'enter':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onRollDice?.()
          preventDefault()
        }
        break

      case 'h':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onSelectHigh?.()
          preventDefault()
        }
        break

      case 'l':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onSelectLow?.()
          preventDefault()
        }
        break

      case '1':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onQuickBet10?.()
          preventDefault()
        }
        break

      case '2':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onQuickBet25?.()
          preventDefault()
        }
        break

      case '5':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onQuickBet50?.()
          preventDefault()
        }
        break

      case '0':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onQuickBet100?.()
          preventDefault()
        }
        break

      case 'm':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onMaxBet?.()
          preventDefault()
        }
        break

      case 's':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onToggleSound?.()
          preventDefault()
        }
        break

      case ' ':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onToggleMute?.()
          preventDefault()
        }
        break

      case '?':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onShowRules?.()
          preventDefault()
        }
        break

      case 'tab':
        if (shiftKey && !ctrlKey && !altKey) {
          shortcuts.onShowHistory?.()
          preventDefault()
        }
        break

      case 'f':
        if (!ctrlKey && !altKey && !shiftKey) {
          shortcuts.onClaimFaucet?.()
          preventDefault()
        }
        break
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])
}

// Hook for specific game actions
export const useGameKeyboardShortcuts = (
  onRollDice: () => void,
  onSelectHigh: () => void,
  onSelectLow: () => void,
  onQuickBet: (amount: number) => void,
  onMaxBet: () => void
) => {
  return useKeyboardShortcuts({
    onRollDice,
    onSelectHigh,
    onSelectLow,
    onQuickBet10: () => onQuickBet(10),
    onQuickBet25: () => onQuickBet(25),
    onQuickBet50: () => onQuickBet(50),
    onQuickBet100: () => onQuickBet(100),
    onMaxBet
  })
}
