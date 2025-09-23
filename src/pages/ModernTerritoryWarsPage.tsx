import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import { useGameStore } from '../store/gameStore'
import ModernHUD from '../components/ModernHUD'
import ModernWeaponSelector from '../components/ModernWeaponSelector'
import ParticleEffects from '../components/ParticleEffects'

/**
 * Modern Territory Wars - Completely Revamped
 * A polished 3D tactical stick figure game with modern UI/UX
 */
export const ModernTerritoryWarsPage: React.FC = () => {
  const { hiloTokens, setBet } = useGameStore()
  const { success, warning } = useToast()

  // Game State
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing')
  const [currentTurn, setCurrentTurn] = useState<'player' | 'cpu'>('player')
  const [stepsRemaining, setStepsRemaining] = useState(8)
  const [maxSteps] = useState(8)
  const [weather, setWeather] = useState<'clear' | 'cloudy' | 'rain' | 'storm'>('clear')
  const [timer, setTimer] = useState(30)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)

  // Particle Effects
  const [particleEffects, setParticleEffects] = useState<Array<{
    id: string
    type: 'explosion' | 'smoke' | 'spark' | 'trail'
    x: number
    y: number
    color?: string
    intensity?: number
  }>>([])

  // Weapon Data
  const weapons = [
    { id: 'grenade', name: 'Grenade', icon: 'grenade', count: 3, color: '#8B4513', description: 'Explosive projectile with area damage' },
    { id: 'rifle', name: 'Assault Rifle', icon: 'gun', count: 10, color: '#654321', description: 'Precise long-range weapon' },
    { id: 'bazooka', name: 'Rocket Launcher', icon: 'bazooka', count: 2, color: '#DC143C', description: 'Heavy explosive with massive damage' },
    { id: 'boot', name: 'Melee Attack', icon: 'boot', count: 999, color: '#2F4F4F', description: 'Close combat attack' }
  ]

  // Team Data
  const playerTeam = {
    name: 'Alpha Squad',
    health: 85,
    maxHealth: 100,
    color: '#00ff88',
    units: 3,
    maxUnits: 3
  }

  const cpuTeam = {
    name: 'Beta Squad',
    health: 92,
    maxHealth: 100,
    color: '#ff4444',
    units: 4,
    maxUnits: 4
  }

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => Math.max(0, prev - 0.1))
      }, 100)
      return () => clearInterval(interval)
    }
  }, [gameState, timer])

  // Weather effects
  useEffect(() => {
    const weatherInterval = setInterval(() => {
      const weathers: Array<'clear' | 'cloudy' | 'rain' | 'storm'> = ['clear', 'cloudy', 'rain', 'storm']
      setWeather(weathers[Math.floor(Math.random() * weathers.length)])
    }, 30000) // Change weather every 30 seconds

    return () => clearInterval(weatherInterval)
  }, [])

  // Event Handlers
  const handleWeaponSelect = (weaponId: string) => {
    setSelectedWeapon(weaponId)
    success(`Selected ${weapons.find(w => w.id === weaponId)?.name}`)
  }

  const handleWeaponUse = (weaponId: string) => {
    const weapon = weapons.find(w => w.id === weaponId)
    if (!weapon || weapon.count === 0) return

    // Add explosion effect
    setParticleEffects(prev => [...prev, {
      id: `explosion_${Date.now()}`,
      type: 'explosion',
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.6,
      color: '#ff4444',
      intensity: 1.5
    }])

    // Add smoke trail
    setTimeout(() => {
      setParticleEffects(prev => [...prev, {
        id: `smoke_${Date.now()}`,
        type: 'smoke',
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.6,
        intensity: 1.0
      }])
    }, 500)

    success(`${weapon.name} fired!`)
    setStepsRemaining(prev => Math.max(0, prev - 1))
  }

  const handleEffectComplete = (effectId: string) => {
    setParticleEffects(prev => prev.filter(effect => effect.id !== effectId))
  }

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleEndTurn = () => {
    setCurrentTurn(prev => prev === 'player' ? 'cpu' : 'player')
    setStepsRemaining(maxSteps)
    setTimer(30)
    
    // Simulate CPU turn
    if (currentTurn === 'player') {
      setTimeout(() => {
        // CPU uses a random weapon
        const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)]
        handleWeaponUse(randomWeapon.id)
        
        // End CPU turn after delay
        setTimeout(() => {
          setCurrentTurn('player')
          setStepsRemaining(maxSteps)
          setTimer(30)
        }, 2000)
      }, 1000)
    }
  }

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit(unitId)
    success(`Selected unit ${unitId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Animated background particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Weather effects */}
        {weather === 'rain' && (
          <div className="absolute inset-0 opacity-30">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-8 bg-blue-300"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-32px',
                }}
                animate={{
                  y: [0, window.innerHeight + 32],
                }}
                transition={{
                  duration: 0.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modern HUD */}
      <ModernHUD
        playerTeam={playerTeam}
        cpuTeam={cpuTeam}
        currentTurn={currentTurn}
        stepsRemaining={stepsRemaining}
        maxSteps={maxSteps}
        weather={weather}
        timer={timer}
        onEndTurn={handleEndTurn}
        onFullscreenToggle={handleFullscreenToggle}
        isFullscreen={isFullscreen}
      />

      {/* Modern Weapon Selector */}
      <ModernWeaponSelector
        weapons={weapons}
        selectedWeapon={selectedWeapon}
        onWeaponSelect={handleWeaponSelect}
        onWeaponUse={handleWeaponUse}
        isVisible={gameState === 'playing'}
      />

      {/* Particle Effects */}
      <ParticleEffects
        effects={particleEffects}
        onEffectComplete={handleEffectComplete}
      />

      {/* Main Game Area */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Game Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Territory Wars
          </h1>
          <p className="text-xl text-gray-300">
            Modern Tactical Combat
          </p>
        </motion.div>

        {/* Game Status */}
        <motion.div
          className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {currentTurn === 'player' ? 'Your Turn' : 'CPU Turn'}
            </div>
            <div className="text-lg text-gray-300">
              Steps Remaining: <span className="text-yellow-400 font-bold">{stepsRemaining}</span>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Balance: <span className="text-green-400 font-bold">{hiloTokens.toLocaleString()} HILO</span>
            </div>
          </div>
        </motion.div>

        {/* Game Instructions */}
        <motion.div
          className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-gray-300 text-sm">
            Select a weapon from the bottom panel and click to fire. 
            Use strategy to defeat the enemy team!
          </p>
        </motion.div>

        {/* Game Stats */}
        <motion.div
          className="grid grid-cols-2 gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
            <div className="text-lg font-bold text-blue-400">Player Team</div>
            <div className="text-2xl font-bold text-white">{playerTeam.units} Units</div>
            <div className="text-sm text-gray-400">Health: {playerTeam.health}%</div>
          </div>
          
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
            <div className="text-lg font-bold text-red-400">CPU Team</div>
            <div className="text-2xl font-bold text-white">{cpuTeam.units} Units</div>
            <div className="text-sm text-gray-400">Health: {cpuTeam.health}%</div>
          </div>
        </motion.div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <motion.div
        className="fixed bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-400"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="space-y-1">
          <div><kbd className="bg-gray-700 px-1 rounded">F11</kbd> Fullscreen</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Esc</kbd> Menu</div>
        </div>
      </motion.div>
    </div>
  )
}

export default ModernTerritoryWarsPage
