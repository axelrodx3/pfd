import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { formatCurrency } from '../lib/utils'
import DiceRoller from '../components/DiceRoller'

/**
 * Game Page Component
 * Main dice game interface with betting and rolling functionality
 */
export const GamePage: React.FC = () => {
  const {
    currentBet,
    selectedSide,
    isRolling,
    lastWin,
    balance,
    setBet,
    selectSide,
    rollDice,
    resetGame,
    gameHistory,
  } = useGameStore()

  const [betAmount, setBetAmount] = useState(currentBet.toString())

  const handleBetChange = (value: string) => {
    const numValue = parseInt(value) || 0
    setBetAmount(value)
    setBet(numValue)
  }

  const handleSideSelect = (side: 'high' | 'low') => {
    if (!isRolling) {
      selectSide(side)
    }
  }

  const handleRoll = async () => {
    if (selectedSide && currentBet > 0 && currentBet <= balance && !isRolling) {
      await rollDice()
    }
  }

  const quickBets = [10, 25, 50, 100, 250, 500]

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-hilo-gold mb-4">
            🎲 Dice High/Low
          </h1>
          <p className="text-xl text-gray-300">
            Choose your side and roll the dice!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <div className="card-hilo-glow">
              {/* Balance Display */}
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-2xl font-bold text-hilo-gold">
                  Balance: {formatCurrency(balance)}
                </div>
              </motion.div>

              {/* Bet Amount Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bet Amount
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => handleBetChange(e.target.value)}
                    className="flex-1 px-4 py-3 bg-hilo-gray-light border border-hilo-gray-light rounded-lg text-white focus:outline-none focus:border-hilo-gold focus:ring-2 focus:ring-hilo-gold/20"
                    placeholder="Enter bet amount"
                    min="1"
                    max={balance}
                    disabled={isRolling}
                  />
                  <button
                    onClick={() => setBet(balance)}
                    className="px-4 py-3 bg-hilo-red text-white rounded-lg hover:bg-hilo-red-dark transition-colors"
                    disabled={isRolling}
                  >
                    Max
                  </button>
                </div>

                {/* Quick Bet Buttons */}
                <div className="flex flex-wrap gap-2">
                  {quickBets.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setBetAmount(amount.toString())
                        setBet(amount)
                      }}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${currentBet === amount
                          ? 'bg-hilo-gold text-hilo-black'
                          : 'bg-hilo-gray-light text-gray-300 hover:bg-hilo-gold/20'
                        }
                      `}
                      disabled={isRolling || amount > balance}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Side Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Choose Your Side
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    onClick={() => handleSideSelect('low')}
                    className={`
                      p-6 rounded-xl font-bold text-lg transition-all duration-300
                      ${selectedSide === 'low'
                        ? 'bg-hilo-green text-white shadow-hilo-glow-green'
                        : 'bg-hilo-gray-light text-gray-300 hover:bg-hilo-green/20'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isRolling}
                  >
                    <div className="text-3xl mb-2">📉</div>
                    <div>LOW</div>
                    <div className="text-sm opacity-75">1-3</div>
                  </motion.button>

                  <motion.button
                    onClick={() => handleSideSelect('high')}
                    className={`
                      p-6 rounded-xl font-bold text-lg transition-all duration-300
                      ${selectedSide === 'high'
                        ? 'bg-hilo-red text-white shadow-hilo-glow-red'
                        : 'bg-hilo-gray-light text-gray-300 hover:bg-hilo-red/20'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isRolling}
                  >
                    <div className="text-3xl mb-2">📈</div>
                    <div>HIGH</div>
                    <div className="text-sm opacity-75">4-6</div>
                  </motion.button>
                </div>
              </div>

              {/* Dice Roller */}
              <div className="mb-8">
                <DiceRoller />
              </div>

              {/* Roll Button */}
              <motion.button
                onClick={handleRoll}
                disabled={!selectedSide || currentBet <= 0 || currentBet > balance || isRolling}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                  ${selectedSide && currentBet > 0 && currentBet <= balance && !isRolling
                    ? 'bg-hilo-gold text-hilo-black hover:bg-hilo-gold-dark hover:shadow-hilo-glow-strong'
                    : 'bg-hilo-gray-light text-gray-500 cursor-not-allowed'
                  }
                `}
                whileHover={selectedSide && currentBet > 0 && currentBet <= balance && !isRolling ? { scale: 1.02 } : {}}
                whileTap={selectedSide && currentBet > 0 && currentBet <= balance && !isRolling ? { scale: 0.98 } : {}}
              >
                {isRolling ? 'Rolling...' : '🎲 Roll Dice'}
              </motion.button>

              {/* Reset Button */}
              {lastWin !== null && (
                <motion.button
                  onClick={resetGame}
                  className="w-full mt-4 py-2 text-hilo-gold hover:text-hilo-gold-dark transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Play Again
                </motion.button>
              )}
            </div>
          </div>

          {/* Game History */}
          <div className="lg:col-span-1">
            <div className="card-hilo">
              <h3 className="text-xl font-bold text-hilo-gold mb-4">
                Recent Games
              </h3>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {gameHistory.slice(0, 10).map((game) => (
                    <motion.div
                      key={game.id}
                      className={`
                        p-3 rounded-lg border-l-4
                        ${game.won ? 'border-hilo-green bg-hilo-green/5' : 'border-hilo-red bg-hilo-red/5'}
                      `}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {game.roll === 1 ? '⚀' : 
                             game.roll === 2 ? '⚁' :
                             game.roll === 3 ? '⚂' :
                             game.roll === 4 ? '⚃' :
                             game.roll === 5 ? '⚄' : '⚅'}
                          </span>
                          <span className="font-medium">
                            {game.side.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${game.won ? 'text-hilo-green' : 'text-hilo-red'}`}>
                            {game.won ? 'WIN' : 'LOSE'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatCurrency(game.bet)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {gameHistory.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No games played yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GamePage
