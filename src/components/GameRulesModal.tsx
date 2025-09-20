import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Dice1,
  TrendingUp,
  TrendingDown,
  Info,
  Trophy,
  Zap,
} from 'lucide-react'

interface GameRulesModalProps {
  isOpen: boolean
  onClose: () => void
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-hilo-gold flex items-center gap-3">
                  <Dice1 className="w-8 h-8" />
                  How to Play HILO Dice
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Objective */}
              <section>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-hilo-gold" />
                  Objective
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Predict whether the dice will roll HIGH (4-6) or LOW (1-3). If
                  you guess correctly, you win! The game uses a 1.98x multiplier
                  with a 2% house edge for fair gameplay.
                </p>
              </section>

              {/* How to Play */}
              <section>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-hilo-gold" />
                  How to Play
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-hilo-gold text-hilo-black rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">
                        Set Your Bet
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Choose your bet amount using the input field or quick
                        bet buttons. You can bet between 1 and your total HILO
                        tokens.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-hilo-gold text-hilo-black rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">
                        Choose Your Side
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Select either HIGH (4-6) or LOW (1-3) to predict the
                        dice outcome.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-hilo-gold text-hilo-black rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">
                        Roll the Dice
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Click the &quot;Roll Dice&quot; button and watch the 3D
                        dice animation. The dice will land on a number between
                        1-6.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-hilo-gold text-hilo-black rounded-full flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">
                        Collect Winnings
                      </h4>
                      <p className="text-gray-300 text-sm">
                        If you guessed correctly, you win 1.98x your bet amount!
                        Your winnings are automatically added to your balance.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Betting Options */}
              <section>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-hilo-gold" />
                  Betting Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <h4 className="font-semibold text-green-400">
                        HIGH (4-6)
                      </h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Bet that the dice will land on 4, 5, or 6. Win rate: ~49%
                      (accounting for house edge)
                    </p>
                  </div>

                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <h4 className="font-semibold text-red-400">LOW (1-3)</h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Bet that the dice will land on 1, 2, or 3. Win rate: ~49%
                      (accounting for house edge)
                    </p>
                  </div>
                </div>
              </section>

              {/* Payouts */}
              <section>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-hilo-gold" />
                  Payouts & Odds
                </h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Multiplier</span>
                      <span className="text-hilo-gold font-bold">1.98x</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">House Edge</span>
                      <span className="text-gray-400">2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Win Probability</span>
                      <span className="text-green-400">~49%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Loss Probability</span>
                      <span className="text-red-400">~51%</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Keyboard Shortcuts */}
              <section>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-hilo-gold" />
                  Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-300">Roll Dice</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">
                      Enter
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-300">Select HIGH</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">
                      H
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-300">Select LOW</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">
                      L
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-300">Quick Bet 10</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">
                      1
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-300">Quick Bet 50</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">
                      5
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-300">Max Bet</span>
                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">
                      M
                    </kbd>
                  </div>
                </div>
              </section>

              {/* Tips */}
              <section>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-hilo-gold" />
                  Pro Tips
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-hilo-gold rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      Start with small bets to get familiar with the game
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-hilo-gold rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      Use the auto-roll feature for consistent betting patterns
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-hilo-gold rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      Check your game history to track your performance
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-hilo-gold rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">
                      Remember: This is a mock casino - no real money is
                      involved!
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 rounded-b-2xl">
              <button
                onClick={onClose}
                className="w-full bg-hilo-gold text-hilo-black font-bold py-3 px-6 rounded-lg hover:bg-hilo-gold/90 transition-colors"
              >
                Got it! Let&apos;s Play
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
