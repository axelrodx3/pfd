import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { useGameStore } from '../store/gameStore'
import Phaser from 'phaser'
// UnitsLayer overlay is used only on the modern page; keep classic Phaser-only

/**
 * Territory Wars (prototype)
 * - Minimal canvas with two teams and basic projectile arc preview
 * - Simple wager input to integrate with existing HILO tokens
 */
export const TerritoryWarsPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaserRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const angleRef = useRef<number>(45)
  const weaponRef = useRef<'grenade' | 'rifle' | 'bazooka'>('grenade')
  const [angle, setAngle] = useState(45)
  const [power, setPower] = useState(50)
  const [wind, setWind] = useState(0)
  const [turn, setTurn] = useState<'blue' | 'red'>('blue')
  const { hiloTokens, setBet } = useGameStore()
  const [wager, setWager] = useState(10)
  const [uiWeapon, setUiWeapon] = useState<'grenade' | 'rifle' | 'bazooka'>('grenade')
  const { success, warning } = useToast()
  const [turnMs, setTurnMs] = useState(30000)
  const [turnColor, setTurnColor] = useState<'blue' | 'red'>('blue')
  const turnColorRef = useRef<'blue' | 'red'>('blue')
  const [useBoot, setUseBoot] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [stepsRemaining, setStepsRemaining] = useState(10)
  const [stepsUsed, setStepsUsed] = useState(0)
  const maxSteps = 10
  const [weaponAmmo, setWeaponAmmo] = useState({ grenade: 3, rifle: 10, bazooka: 2, boot: 999 })
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [showEndTurn, setShowEndTurn] = useState(false)
  const [gameState, setGameState] = useState<'playing' | 'gameOver' | 'playerWins' | 'cpuWins'>('playing')
  const [playerScore, setPlayerScore] = useState(0)
  const [cpuScore, setCpuScore] = useState(0)
  const [roundNumber, setRoundNumber] = useState(1)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  // Enhanced bug report structure
  interface EnhancedBugReport {
    id: string
    message: string
    timestamp: number
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: 'ui' | 'gameplay' | 'performance' | 'network' | 'system'
    context: {
      gameState: any
      playerActions: string[]
      systemInfo: any
      stackTrace?: string
      screenshot?: string
    }
    resolved: boolean
    userNotes?: string
  }

  const [bugReports, setBugReports] = useState<EnhancedBugReport[]>([])
  const [showBugReport, setShowBugReport] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const [lastErrorTime, setLastErrorTime] = useState<Date | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | 'ui' | 'gameplay' | 'performance' | 'network' | 'system'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const minimalHUD = true

  // Units overlay (ensure visibility on classic page too)
  // Classic uses Phaser drawing; no SVG overlay needed

  // Persistent storage functions
  const saveBugReportsToStorage = (reports: EnhancedBugReport[]) => {
    try {
      localStorage.setItem('territoryWars_bugReports', JSON.stringify(reports))
    } catch (error) {
      console.error('Failed to save bug reports to storage:', error)
    }
  }

  const loadBugReportsFromStorage = (): EnhancedBugReport[] => {
    try {
      const stored = localStorage.getItem('territoryWars_bugReports')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Ensure all reports have the new structure
        return parsed.map((report: any) => ({
          ...report,
          category: report.category || 'system',
          context: report.context || { gameState: {}, playerActions: [], systemInfo: {} },
          resolved: report.resolved || false
        }))
      }
    } catch (error) {
      console.error('Failed to load bug reports from storage:', error)
    }
    return []
  }

  // Enhanced bug reporting system
  const addBugReport = (
    message: string, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    category: 'ui' | 'gameplay' | 'performance' | 'network' | 'system' = 'system',
    stackTrace?: string
  ) => {
    const newReport: EnhancedBugReport = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      message,
      timestamp: Date.now(),
      severity,
      category,
      context: {
        gameState: {
          turnColor: turnColorRef.current,
          gameState,
          playerScore,
          cpuScore,
          roundNumber,
          stepsRemaining,
          stepsUsed,
          maxSteps,
          isPlayerTurn,
          weaponAmmo
        },
        playerActions: [], // Could be enhanced to track recent actions
        systemInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString()
        },
        stackTrace
      },
      resolved: false
    }

    setBugReports(prev => {
      const updated = [newReport, ...prev].slice(0, 50) // Keep last 50 reports
      saveBugReportsToStorage(updated)
      return updated
    })
    
    setErrorCount(prev => prev + 1)
    setLastErrorTime(new Date())
    console.error(`[BUG REPORT] ${severity.toUpperCase()}: ${message}`)

    // Auto-capture screenshot for critical errors
    if (severity === 'critical') {
      captureScreenshot(newReport.id)
    }
  }

  // Screenshot capture function
  const captureScreenshot = async (bugId: string) => {
    try {
      if (phaserGameRef.current && phaserGameRef.current.canvas) {
        const canvas = phaserGameRef.current.canvas
        const dataURL = canvas.toDataURL('image/png')
        
        // Update the bug report with screenshot
        setBugReports(prev => {
          const updated = prev.map(report => 
            report.id === bugId 
              ? { ...report, context: { ...report.context, screenshot: dataURL } }
              : report
          )
          saveBugReportsToStorage(updated)
          return updated
        })
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
    }
  }

  // Load bug reports from storage on mount
  useEffect(() => {
    const storedReports = loadBugReportsFromStorage()
    setBugReports(storedReports)
    
    // Calculate error count from stored reports
    const unresolvedCount = storedReports.filter(report => !report.resolved).length
    setErrorCount(unresolvedCount)
    
    if (storedReports.length > 0) {
      const lastError = storedReports[0]
      setLastErrorTime(new Date(lastError.timestamp))
    }
  }, [])

  // State validation function
  const validateGameState = () => {
    if (stepsRemaining > maxSteps) {
      addBugReport(`Steps remaining (${stepsRemaining}) exceeds max steps (${maxSteps})`, 'high', 'gameplay')
      setStepsRemaining(maxSteps)
    }
    if (stepsRemaining < 0) {
      addBugReport(`Steps remaining is negative: ${stepsRemaining}`, 'high', 'gameplay')
      setStepsRemaining(0)
    }
    if (stepsUsed < 0) {
      addBugReport(`Steps used is negative: ${stepsUsed}`, 'high', 'gameplay')
      setStepsUsed(0)
    }
    if (stepsUsed + stepsRemaining !== maxSteps) {
      addBugReport(`Steps math error: used (${stepsUsed}) + remaining (${stepsRemaining}) ≠ max (${maxSteps})`, 'medium', 'gameplay')
      setStepsUsed(maxSteps - stepsRemaining)
    }
  }

  // Validate state periodically
  useEffect(() => {
    const validationInterval = setInterval(validateGameState, 1000)
    return () => clearInterval(validationInterval)
  }, [stepsRemaining, stepsUsed, maxSteps])

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      addBugReport(`Fullscreen Error: ${error}`, 'medium', 'ui')
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Filter and search functions
  const filteredBugReports = bugReports.filter(report => {
    const matchesSeverity = filterSeverity === 'all' || report.severity === filterSeverity
    const matchesCategory = filterCategory === 'all' || report.category === filterCategory
    const matchesSearch = searchTerm === '' || 
      report.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesResolved = showResolved || !report.resolved
    
    return matchesSeverity && matchesCategory && matchesSearch && matchesResolved
  })

  const getAnalyticsData = () => {
    const total = bugReports.length
    const unresolved = bugReports.filter(r => !r.resolved).length
    const bySeverity = {
      critical: bugReports.filter(r => r.severity === 'critical').length,
      high: bugReports.filter(r => r.severity === 'high').length,
      medium: bugReports.filter(r => r.severity === 'medium').length,
      low: bugReports.filter(r => r.severity === 'low').length
    }
    const byCategory = {
      ui: bugReports.filter(r => r.category === 'ui').length,
      gameplay: bugReports.filter(r => r.category === 'gameplay').length,
      performance: bugReports.filter(r => r.category === 'performance').length,
      network: bugReports.filter(r => r.category === 'network').length,
      system: bugReports.filter(r => r.category === 'system').length
    }
    
    return { total, unresolved, bySeverity, byCategory }
  }

  // Generate comprehensive bug report for sharing
  const generateBugReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      gameState: {
        turnColor: turnColorRef.current,
        gameState,
        playerScore,
        cpuScore,
        roundNumber,
        stepsRemaining,
        stepsUsed,
        maxSteps,
        isPlayerTurn,
        weaponAmmo
      },
      bugs: bugReports.map(bug => ({
        message: bug.message,
        severity: bug.severity,
        timestamp: new Date(bug.timestamp).toISOString()
      })),
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`
      }
    }
    
    return JSON.stringify(report, null, 2)
  }

  // Copy bug report to clipboard
  const copyBugReport = async () => {
    try {
      const report = generateBugReport()
      await navigator.clipboard.writeText(report)
      addBugReport('Bug report copied to clipboard successfully', 'low')
    } catch (error) {
      addBugReport(`Failed to copy bug report: ${error}`, 'medium')
    }
  }

  // Copy individual bug report
  const copyIndividualBug = async (bug: any) => {
    try {
      const individualReport = {
        timestamp: new Date(bug.timestamp).toISOString(),
        severity: bug.severity,
        message: bug.message,
        gameState: {
          turnColor: turnColorRef.current,
          gameState,
          playerScore,
          cpuScore,
          roundNumber,
          stepsRemaining,
          stepsUsed,
          maxSteps,
          isPlayerTurn,
          weaponAmmo
        },
        systemInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`
        }
      }
      
      const reportText = JSON.stringify(individualReport, null, 2)
      await navigator.clipboard.writeText(reportText)
      addBugReport(`Individual bug report copied to clipboard`, 'low')
    } catch (error) {
      addBugReport(`Failed to copy individual bug report: ${error}`, 'medium')
    }
  }

  // Copy all bug reports as a list
  const copyAllBugs = async () => {
    try {
      const bugsList = bugReports.map(bug => 
        `[${bug.severity.toUpperCase()}] ${new Date(bug.timestamp).toLocaleString()}: ${bug.message}`
      ).join('\n')
      
      const reportText = `Bug Reports Summary (${bugReports.length} total):\n\n${bugsList}\n\nGame State: ${gameState} | Turn: ${turnColorRef.current} | Steps: ${stepsRemaining}/${maxSteps}`
      
      await navigator.clipboard.writeText(reportText)
      addBugReport('All bug reports copied to clipboard', 'low')
    } catch (error) {
      addBugReport(`Failed to copy all bug reports: ${error}`, 'medium')
    }
  }

  // Real-time bug detection and monitoring system
  useEffect(() => {
    // Global error handler for uncaught errors
    const handleGlobalError = (event: ErrorEvent) => {
      addBugReport(`JavaScript Error: ${event.message} at ${event.filename}:${event.lineno}`, 'critical', 'system', event.error?.stack)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addBugReport(`Promise Rejection: ${event.reason}`, 'high', 'system')
    }

    // Add global error listeners
    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Real-time game state monitoring
    const gameStateMonitor = setInterval(() => {
      // Check for invalid game states
      if (stepsRemaining < 0) {
        addBugReport(`Invalid Steps: ${stepsRemaining} (negative value)`, 'high', 'gameplay')
      }
      
      if (turnMs < 0) {
        addBugReport(`Invalid Timer: ${turnMs}ms (negative value)`, 'high', 'gameplay')
      }

      // Check for game logic inconsistencies
      if (gameState === 'playing' && !isPlayerTurn && stepsRemaining > 0) {
        addBugReport('Logic Error: Player has steps but not their turn', 'medium', 'gameplay')
      }

      if (gameState === 'playing' && isPlayerTurn && stepsRemaining <= 0) {
        addBugReport('Logic Error: Player turn but no steps remaining', 'medium', 'gameplay')
      }

      // Check for invalid weapon states
      if (weaponAmmo.grenade < 0 || weaponAmmo.rifle < 0 || weaponAmmo.bazooka < 0) {
        addBugReport('Invalid Ammo: Negative ammo count detected', 'high', 'gameplay')
      }

      // Check for score inconsistencies
      if (playerScore < 0 || cpuScore < 0) {
        addBugReport('Invalid Score: Negative score detected', 'medium', 'gameplay')
      }

      // Check for round number issues
      if (roundNumber < 1) {
        addBugReport('Invalid Round: Round number is less than 1', 'medium', 'gameplay')
      }
    }, 1000) // Check every second for real-time detection

    // Real-time performance monitoring
    const performanceMonitor = setInterval(() => {
      // Memory usage monitoring
      if ((performance as any).memory) {
        const memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
        const memoryLimit = (performance as any).memory.jsHeapSizeLimit / 1024 / 1024 // MB
        const memoryPercent = (memoryUsage / memoryLimit) * 100

        if (memoryPercent > 80) {
          addBugReport(`Memory Warning: ${memoryPercent.toFixed(1)}% used (${memoryUsage.toFixed(1)}MB/${memoryLimit.toFixed(1)}MB)`, 'high', 'performance')
        } else if (memoryPercent > 60) {
          addBugReport(`Memory Alert: ${memoryPercent.toFixed(1)}% used`, 'medium', 'performance')
        }
      }

      // FPS monitoring
      let lastTime = performance.now()
      let frameCount = 0
      const fpsMonitor = () => {
        frameCount++
        const currentTime = performance.now()
        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
          if (fps < 30) {
            addBugReport(`Low FPS: ${fps} frames per second`, 'medium', 'performance')
          }
          frameCount = 0
          lastTime = currentTime
        }
        requestAnimationFrame(fpsMonitor)
      }
      fpsMonitor()
    }, 2000)

    // Real-time Phaser scene monitoring
    const phaserMonitor = setInterval(() => {
      if (phaserGameRef.current?.scene?.scenes[0]) {
        const scene = phaserGameRef.current.scene.scenes[0] as any
        
        // Check for null/undefined critical objects
        if (!scene.player) {
          addBugReport('Critical Error: Player object is null/undefined', 'critical', 'gameplay')
        }
        if (!scene.enemy) {
          addBugReport('Critical Error: Enemy object is null/undefined', 'critical', 'gameplay')
        }

        // Check for invalid positions
        if (scene.player && (isNaN(scene.player.x) || isNaN(scene.player.y))) {
          addBugReport('Position Error: Player has invalid coordinates', 'critical', 'gameplay')
        }
        if (scene.enemy && (isNaN(scene.enemy.x) || isNaN(scene.enemy.y))) {
          addBugReport('Position Error: Enemy has invalid coordinates', 'critical', 'gameplay')
        }

        // Check for infinite values
        if (scene.player && (!isFinite(scene.player.x) || !isFinite(scene.player.y))) {
          addBugReport('Position Error: Player has infinite coordinates', 'critical', 'gameplay')
        }
        if (scene.enemy && (!isFinite(scene.enemy.x) || !isFinite(scene.enemy.y))) {
          addBugReport('Position Error: Enemy has infinite coordinates', 'critical', 'gameplay')
        }
      }
    }, 500) // Check every 500ms for critical issues

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      clearInterval(gameStateMonitor)
      clearInterval(performanceMonitor)
      clearInterval(phaserMonitor)
    }
  }, [stepsRemaining, turnMs, gameState, isPlayerTurn, weaponAmmo, playerScore, cpuScore, roundNumber])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to close bug report panel
      if (event.key === 'Escape' && showBugReport) {
        setShowBugReport(false)
      }
      
      // F11 key to toggle fullscreen
      if (event.key === 'F11') {
        event.preventDefault()
        toggleFullscreen()
      }
      
      // Alt + Enter to toggle fullscreen (alternative shortcut)
      if (event.altKey && event.key === 'Enter') {
        event.preventDefault()
        toggleFullscreen()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showBugReport])

  useEffect(() => {
    angleRef.current = angle
  }, [angle])

  useEffect(() => {
    turnColorRef.current = turnColor
    // Reset steps when turn changes - sync with Phaser scene
    setStepsRemaining(maxSteps)
    setStepsUsed(0)
    
    // Ensure Phaser scene is also updated
    if (phaserGameRef.current?.scene?.scenes[0]) {
      const scene = phaserGameRef.current.scene.scenes[0] as any
      if (scene.stepsRemaining !== undefined) {
        scene.stepsRemaining = maxSteps
        scene.stepsUsed = 0
      }
    }
  }, [turnColor, maxSteps])

  // Turn timer countdown
  useEffect(() => {
    const id = setInterval(() => {
      setTurnMs(ms => {
        if (ms <= 100) {
          // switch turn color and reset timer when it expires
          setTurnColor(c => (c === 'blue' ? 'red' : 'blue'))
          return 30000
        }
        return ms - 100
      })
    }, 100)
    return () => clearInterval(id)
  }, [])

  // Phaser minimal prototype (one scene)
  useEffect(() => {
    if (!phaserRef.current || phaserGameRef.current) return

    class TWScene extends Phaser.Scene {
      player!: Phaser.GameObjects.Rectangle
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys
      power = 0
      charging = false
      weapon: 'grenade' | 'rifle' | 'bazooka' = 'grenade'
      playerFacing: -1 | 1 = 1
      keyA!: Phaser.Input.Keyboard.Key
      keyD!: Phaser.Input.Keyboard.Key
      keyW!: Phaser.Input.Keyboard.Key
      keyQ!: Phaser.Input.Keyboard.Key
      keyE!: Phaser.Input.Keyboard.Key
      keyT!: Phaser.Input.Keyboard.Key
      keySpace!: Phaser.Input.Keyboard.Key
      ground!: Phaser.GameObjects.Rectangle
      platforms: Phaser.GameObjects.Rectangle[] = []
      enemy!: Phaser.GameObjects.Rectangle
      stickLayer?: Phaser.GameObjects.Layer
      stepDistanceAcc: number = 0
      teamA!: any[]
      teamB!: any[]
      teamAHP: number[] = [100, 100, 100]
      teamBHP: number[] = [100, 100, 100]
      teamAClasses: Array<'soldier'|'sniper'|'heavy'|'medic'> = ['soldier', 'sniper', 'heavy']
      teamBClasses: Array<'soldier'|'sniper'|'heavy'|'medic'> = ['soldier', 'sniper', 'heavy']
      playerIdx = 0
      enemyIdx = 0
      lastTurn: 'blue' | 'red' = 'blue'
      stepsRemaining = 10
      maxSteps = 10
      stepsUsed = 0
      cpuStepsRemaining = 10
      cpuStepsUsed = 0
      isPlayerTurn = true
      weaponAmmo = { grenade: 3, rifle: 10, bazooka: 2, boot: 999 }
      cpuWeaponAmmo = { grenade: 3, rifle: 10, bazooka: 2, boot: 999 }
      gameState = 'playing' // 'playing', 'gameOver', 'playerWins', 'cpuWins'
      roundNumber = 1
      playerScore = 0
      cpuScore = 0
      deadUnits: Array<{unit: any, team: 'A'|'B', index: number}> = []
      selectedUnitIndex = 0
      showUnitSelection = false
      firstPlayerTeam = 'A' // Which team goes first this round
      roundWinner: 'A'|'B'|null = null
      powerUps: Array<{x: number, y: number, type: 'health'|'ammo', collected: boolean, sprite: any}> = []
      powerUpSpawnTimer = 0
      grenades: Array<{ g: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body }, lastBounceTs: number }> = []
      bullets: Array<{ b: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body }, ric: number }> = []
      playerHP = 100
      enemyHP = 100
      ac?: AudioContext
      lastKickAt = 0
      activeTimerText?: Phaser.GameObjects.Text
      clouds: Phaser.GameObjects.Graphics[] = []
      groundTop = 0
      playSfx(type: 'jump' | 'shot' | 'explosion' | 'hit' | 'collect' | 'heal') {
        try {
          if (!this.ac) this.ac = new (window.AudioContext || (window as any).webkitAudioContext)()
          const ctx = this.ac
          const o = ctx!.createOscillator()
          const g = ctx!.createGain()
          o.connect(g)
          g.connect(ctx!.destination)
          
          // Enhanced sound effects
          if (type === 'jump') {
            o.frequency.value = 520
            o.type = 'sine'
          } else if (type === 'shot') {
            o.frequency.value = 880
            o.type = 'square'
          } else if (type === 'explosion') {
            o.frequency.value = 180
            o.type = 'sawtooth'
          } else if (type === 'hit') {
            o.frequency.value = 300
            o.type = 'triangle'
          } else if (type === 'collect') {
            o.frequency.value = 660
            o.type = 'sine'
          } else if (type === 'heal') {
            o.frequency.value = 440
            o.type = 'sine'
          }
          
          const now = ctx!.currentTime
          o.start(now)
          
          if (type === 'explosion') {
            g.gain.setValueAtTime(0.4, now)
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
            o.stop(now + 0.25)
          } else if (type === 'hit') {
            g.gain.setValueAtTime(0.3, now)
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
            o.stop(now + 0.15)
          } else if (type === 'collect' || type === 'heal') {
            g.gain.setValueAtTime(0.2, now)
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
            o.stop(now + 0.2)
          } else {
            g.gain.setValueAtTime(0.2, now)
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
            o.stop(now + 0.12)
          }
        } catch {}
      }

      // Particle effects system
      createParticles(x: number, y: number, type: 'explosion' | 'hit' | 'collect' | 'heal') {
        const particleCount = type === 'explosion' ? 15 : 8
        
        for (let i = 0; i < particleCount; i++) {
          const particle = this.add.circle(x, y, 2, this.getParticleColor(type))
          const angle = (Math.PI * 2 * i) / particleCount
          const speed = Phaser.Math.Between(50, 150)
          const vx = Math.cos(angle) * speed
          const vy = Math.sin(angle) * speed
          
          this.tweens.add({
            targets: particle,
            x: particle.x + vx,
            y: particle.y + vy,
            alpha: 0,
            scale: 0,
            duration: Phaser.Math.Between(500, 1000),
            onComplete: () => particle.destroy()
          })
        }
      }

      getParticleColor(type: 'explosion' | 'hit' | 'collect' | 'heal'): number {
        switch (type) {
          case 'explosion': return 0xff4444
          case 'hit': return 0xff0000
          case 'collect': return 0xffff00
          case 'heal': return 0x00ff00
          default: return 0xffffff
        }
      }

      // Walking animation is now handled in draw3DStickFigure
      drawWalkingAnimation(unit: any) {
        // Do nothing - animation is built into the drawing function
      }


      // Update existing stick figure position
      updateStickFigure(x: number, y: number, color: number, facing: number, label: string, isActive: boolean, isWalking: boolean) {
        // Find existing graphics for this unit
        const existingGraphics = this.children.list.find(child => 
          child.getData('tag') === 'stickFigure' && 
          Math.abs((child as any).x - x) < 50 && Math.abs((child as any).y - y) < 50
        ) as Phaser.GameObjects.Graphics
        
        if (existingGraphics) {
          // Update position
          existingGraphics.setPosition(x, y)
          
          // Update label if it exists
          const labelText = existingGraphics.getData('label')
          if (labelText) {
            labelText.setPosition(x, y - 40)
          }
        }
      }


      // Simple stick figure drawing - no complex graphics
      draw3DStickFigure(x: number, y: number, color: number, facing: number, label: string, isActive: boolean, isWalking: boolean) {
        // Do nothing - no graphics to prevent issues
      }

      // CPU AI Logic
      cpuAI() {
        const dx = this.player.x - this.enemy.x
        const dy = this.player.y - this.enemy.y
        const distance = Math.hypot(dx, dy)
        const unitClass = this.getUnitClass('B', this.enemyIdx)
        const modifiers = this.getClassModifiers(unitClass)
        
        // Strategic positioning based on unit class
        if (unitClass === 'sniper') {
          this.cpuSniperAI(dx, dy, distance)
        } else if (unitClass === 'heavy') {
          this.cpuHeavyAI(dx, dy, distance)
        } else if (unitClass === 'medic') {
          this.cpuMedicAI(dx, dy, distance)
        } else {
          this.cpuSoldierAI(dx, dy, distance)
        }
      }

      cpuSniperAI(dx: number, dy: number, distance: number) {
        // Snipers prefer long range and high ground
        if (this.cpuStepsRemaining > 0) {
          // Move to high ground or maintain distance
          const targetPlatform = this.findBestPlatform('high')
          if (targetPlatform) {
            const platformDx = targetPlatform.x - this.enemy.x
            if (Math.abs(platformDx) > 20) {
              this.enemy.x += platformDx > 0 ? 1.5 : -1.5
              this.cpuStepsRemaining = Math.max(0, this.cpuStepsRemaining - 0.1)
            }
          } else if (distance < 150) {
            // Move away to maintain sniper range
            this.enemy.x += dx > 0 ? -1.5 : 1.5
            this.cpuStepsRemaining = Math.max(0, this.cpuStepsRemaining - 0.1)
          }
        }
        
        // Attack at long range
        if (distance > 200 && distance < 400 && this.cpuStepsRemaining > 0) {
          this.cpuAttack()
        }
      }

      cpuHeavyAI(dx: number, dy: number, distance: number) {
        // Heavies prefer close combat and cover
        if (this.cpuStepsRemaining > 0) {
          if (distance > 100) {
            // Move towards player
            this.enemy.x += dx > 0 ? 1 : -1
            this.cpuStepsRemaining = Math.max(0, this.cpuStepsRemaining - 0.1)
          } else {
            // Find cover
            const coverPlatform = this.findBestPlatform('cover')
            if (coverPlatform) {
              const coverDx = coverPlatform.x - this.enemy.x
              if (Math.abs(coverDx) > 20) {
                this.enemy.x += coverDx > 0 ? 1 : -1
                this.cpuStepsRemaining = Math.max(0, this.cpuStepsRemaining - 0.1)
              }
            }
          }
        }
        
        // Attack at close range
        if (distance < 150 && this.cpuStepsRemaining > 0) {
          this.cpuAttack()
        }
      }

      cpuMedicAI(dx: number, dy: number, distance: number) {
        // Medics support other units and avoid direct combat
        const nearestAlly = this.findNearestAlly()
        if (nearestAlly && this.cpuStepsRemaining > 0) {
          const allyDx = nearestAlly.x - this.enemy.x
          if (Math.abs(allyDx) > 30) {
            this.enemy.x += allyDx > 0 ? 1.2 : -1.2
            this.cpuStepsRemaining = Math.max(0, this.cpuStepsRemaining - 0.1)
          } else {
            // Heal ally if close enough
            this.healAlly(nearestAlly)
          }
        }
        
        // Attack only if no allies need help
        if (distance < 100 && this.cpuStepsRemaining > 0 && !nearestAlly) {
          this.cpuAttack()
        }
      }

      cpuSoldierAI(dx: number, dy: number, distance: number) {
        // Balanced approach
        if (this.cpuStepsRemaining > 0) {
          if (distance > 80) {
            // Move towards player
            this.enemy.x += dx > 0 ? 1.5 : -1.5
            this.cpuStepsRemaining = Math.max(0, this.cpuStepsRemaining - 0.1)
          }
        }
        
        // Attack at medium range
        if (distance < 250 && this.cpuStepsRemaining > 0) {
          this.cpuAttack()
        }
      }

      findBestPlatform(type: 'high'|'cover'): any {
        if (type === 'high') {
          return this.platforms.reduce((highest, platform) => 
            platform.y < highest.y ? platform : highest
          )
        } else {
          // Find platform that provides cover from player
          return this.platforms.find(platform => 
            Math.abs(platform.x - this.player.x) < 100
          )
        }
      }

      findNearestAlly(): any {
        const allies = this.teamB.filter((unit, i) => 
          i !== this.enemyIdx && this.teamBHP[i] > 0 && this.teamBHP[i] < 80
        )
        if (allies.length === 0) return null
        
        return allies.reduce((nearest, ally) => {
          const nearestDist = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, nearest.x, nearest.y)
          const allyDist = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, ally.x, ally.y)
          return allyDist < nearestDist ? ally : nearest
        })
      }

      healAlly(ally: any) {
        const allyIndex = this.teamB.indexOf(ally)
        if (allyIndex >= 0) {
          this.teamBHP[allyIndex] = Math.min(100, this.teamBHP[allyIndex] + 30)
          
          // Healing effect
          const effect = this.add.circle(ally.x, ally.y - 20, 12, 0x00ff00)
          this.tweens.add({ targets: effect, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 500, onComplete: () => effect.destroy() })
          this.cpuStepsRemaining = Math.max(0, this.cpuStepsRemaining - 1)
        }
      }

      cpuAttack() {
        // CPU chooses weapon based on distance and ammo
        const dx = this.player.x - this.enemy.x
        const distance = Math.abs(dx)
        
        let chosenWeapon = 'rifle'
        if (distance > 150 && this.cpuWeaponAmmo.bazooka > 0) {
          chosenWeapon = 'bazooka'
        } else if (distance < 100 && this.cpuWeaponAmmo.grenade > 0) {
          chosenWeapon = 'grenade'
        } else if (distance < 50 && this.cpuWeaponAmmo.boot > 0) {
          chosenWeapon = 'boot'
        }
        
        this.weapon = chosenWeapon as any
        this.fire()
        this.cpuStepsRemaining = Math.max(0, this.cpuStepsRemaining - 2) // Attack costs 2 steps
      }

      endPlayerTurn() {
        this.isPlayerTurn = false
        this.cpuStepsRemaining = this.maxSteps
        this.cpuStepsUsed = 0
        setTurnColor('red')
        setTurnMs(30000)
        setIsPlayerTurn(false)
      }

      endCPUTurn() {
        this.isPlayerTurn = true
        this.stepsRemaining = this.maxSteps
        this.stepsUsed = 0
        setTurnColor('blue')
        setTurnMs(30000)
        setIsPlayerTurn(true)
      }

      // Line of sight checking
      hasLineOfSight(fromX: number, fromY: number, toX: number, toY: number): boolean {
        const dx = toX - fromX
        const dy = toY - fromY
        const distance = Math.hypot(dx, dy)
        const steps = Math.ceil(distance / 5) // Check every 5 pixels
        
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const checkX = fromX + dx * t
          const checkY = fromY + dy * t
          
          // Check if line passes through any platform
          for (const platform of this.platforms) {
            const px = platform.x - platform.width/2
            const py = platform.y - platform.height/2
            if (checkX >= px && checkX <= px + platform.width && 
                checkY >= py && checkY <= py + platform.height) {
              return false // Blocked by platform
            }
          }
        }
        return true // Clear line of sight
      }

      // Check if unit is in cover (behind a platform)
      isInCover(unitX: number, unitY: number, attackerX: number, attackerY: number): boolean {
        const dx = unitX - attackerX
        const dy = unitY - attackerY
        const distance = Math.hypot(dx, dy)
        const steps = Math.ceil(distance / 10) // Check every 10 pixels
        
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const checkX = attackerX + dx * t
          const checkY = attackerY + dy * t
          
          // Check if line passes through any platform
          for (const platform of this.platforms) {
            const px = platform.x - platform.width/2
            const py = platform.y - platform.height/2
            if (checkX >= px && checkX <= px + platform.width && 
                checkY >= py && checkY <= py + platform.height) {
              return true // Unit is in cover
            }
          }
        }
        return false // No cover
      }

      // Draw weapon range indicator
      drawWeaponRange() {
        const angle = Phaser.Math.DegToRad(angleRef.current)
        const range = this.getWeaponRange()
        const endX = this.player.x + Math.cos(angle) * range
        const endY = this.player.y - 30 - Math.sin(angle) * range
        
        // Draw range line
        const g = this.add.graphics()
        g.lineStyle(2, 0x00ff00, 0.6)
        g.beginPath()
        g.moveTo(this.player.x, this.player.y - 30)
        g.lineTo(endX, endY)
        g.strokePath()
        g.setData('tag', 'range')
        
        // Draw range circle at end
        g.fillStyle(0x00ff00, 0.3)
        g.fillCircle(endX, endY, 8)
        g.setData('tag', 'range')
      }

      getWeaponRange(): number {
        switch (this.weapon) {
          case 'rifle': return 400
          case 'bazooka': return 300
          case 'grenade': return 200
          default: return 200
        }
      }

      // Check for unit deaths and handle elimination
      checkUnitDeaths() {
        // Check player team units
        for (let i = 0; i < this.teamA.length; i++) {
          if (this.teamAHP[i] <= 0 && this.teamA[i].visible) {
            this.eliminateUnit(this.teamA[i], 'A', i)
          }
        }
        
        // Check enemy team units
        for (let i = 0; i < this.teamB.length; i++) {
          if (this.teamBHP[i] <= 0 && this.teamB[i].visible) {
            this.eliminateUnit(this.teamB[i], 'B', i)
          }
        }
        
        // Check win conditions
        this.checkWinConditions()
      }

      eliminateUnit(unit: any, team: 'A'|'B', index: number) {
        // Hide unit and add to dead units
        unit.visible = false
        unit.setData('dead', true)
        this.deadUnits.push({ unit, team, index })
        
        // Death effect
        const deathEffect = this.add.circle(unit.x, unit.y - 15, 15, 0xff0000)
        this.tweens.add({ 
          targets: deathEffect, 
          alpha: 0, 
          scaleX: 2, 
          scaleY: 2, 
          duration: 500, 
          onComplete: () => deathEffect.destroy() 
        })
        
        // Update score
        if (team === 'B') {
          this.playerScore++
        } else {
          this.cpuScore++
        }
        
        this.playSfx('explosion')
      }

      checkWinConditions() {
        const alivePlayerUnits = this.teamA.filter((unit, i) => this.teamAHP[i] > 0)
        const aliveCpuUnits = this.teamB.filter((unit, i) => this.teamBHP[i] > 0)
        
        if (alivePlayerUnits.length === 0) {
          this.gameState = 'cpuWins'
          this.endGame('CPU Wins!')
        } else if (aliveCpuUnits.length === 0) {
          this.gameState = 'playerWins'
          this.endGame('Player Wins!')
        }
      }

      endGame(message: string) {
        // Stop all game activity
        this.gameState = 'gameOver'
        this.isPlayerTurn = false
        
        // Show game over screen
        const gameOverText = this.add.text(
          this.scale.width / 2, 
          this.scale.height / 2, 
          message, 
          { 
            fontSize: '48px', 
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
          }
        ).setOrigin(0.5)
        
        const scoreText = this.add.text(
          this.scale.width / 2, 
          this.scale.height / 2 + 60, 
          `Player: ${this.playerScore} | CPU: ${this.cpuScore}`, 
          { 
            fontSize: '24px', 
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
          }
        ).setOrigin(0.5)
        
        const restartText = this.add.text(
          this.scale.width / 2, 
          this.scale.height / 2 + 120, 
          'Press R to Restart', 
          { 
            fontSize: '20px', 
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
          }
        ).setOrigin(0.5)
        
        // Add restart functionality
        this.input.keyboard?.on('keydown-R', () => {
          this.restartGame()
        })
      }

      restartGame() {
        // Reset all game state
        this.gameState = 'playing'
        this.roundNumber = 1
        this.playerScore = 0
        this.cpuScore = 0
        this.deadUnits = []
        this.isPlayerTurn = true
        this.stepsRemaining = this.maxSteps
        this.cpuStepsRemaining = this.maxSteps
        
        // Reset weapon ammo
        this.weaponAmmo = { grenade: 3, rifle: 10, bazooka: 2, boot: 999 }
        this.cpuWeaponAmmo = { grenade: 3, rifle: 10, bazooka: 2, boot: 999 }
        
        // Reset unit health
        this.teamAHP = [100, 100, 100]
        this.teamBHP = [100, 100, 100]
        this.playerHP = 100
        this.enemyHP = 100
        
        // Show all units again
        this.teamA.forEach(unit => {
          unit.visible = true
          unit.setData('dead', false)
        })
        this.teamB.forEach(unit => {
          unit.visible = true
          unit.setData('dead', false)
        })
        
        // Clear all projectiles
        this.grenades.forEach(g => g.g.destroy())
        this.bullets.forEach(b => b.b.destroy())
        this.grenades = []
        this.bullets = []
        
        // Reset turn
        setTurnColor('blue')
        setTurnMs(30000)
      }


      // Power-up system
      spawnPowerUp() {
        const x = Phaser.Math.Between(100, this.scale.width - 100)
        const y = Phaser.Math.Between(200, this.scale.height - 200)
        const type = Phaser.Math.Between(0, 1) === 0 ? 'health' : 'ammo'
        
        const sprite = this.add.circle(x, y, 12, type === 'health' ? 0x00ff00 : 0xffff00)
        sprite.setData('powerUp', true)
        sprite.setData('type', type)
        
        // Pulsing animation
        this.tweens.add({
          targets: sprite,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 1000,
          yoyo: true,
          repeat: -1
        })
        
        this.powerUps.push({ x, y, type, collected: false, sprite })
      }

      checkPowerUpCollection() {
        this.powerUps.forEach(powerUp => {
          if (!powerUp.collected) {
            // Check if any unit is near the power-up
            const allUnits = [...this.teamA, ...this.teamB]
            allUnits.forEach(unit => {
              const distance = Phaser.Math.Distance.Between(unit.x, unit.y, powerUp.x, powerUp.y)
              if (distance < 30) {
                this.collectPowerUp(powerUp, unit)
              }
            })
          }
        })
      }

      collectPowerUp(powerUp: any, unit: any) {
        powerUp.collected = true
        powerUp.sprite.destroy()
        
        // Determine which team collected it
        const isPlayerTeam = this.teamA.includes(unit)
        
        if (powerUp.type === 'health') {
          // Restore health to the unit
          const unitIndex = isPlayerTeam ? this.teamA.indexOf(unit) : this.teamB.indexOf(unit)
          if (isPlayerTeam) {
            this.teamAHP[unitIndex] = Math.min(100, this.teamAHP[unitIndex] + 50)
          } else {
            this.teamBHP[unitIndex] = Math.min(100, this.teamBHP[unitIndex] + 50)
          }
          
          // Health collection effect
          const effect = this.add.circle(unit.x, unit.y - 20, 15, 0x00ff00)
          this.tweens.add({ targets: effect, alpha: 0, scaleX: 2, scaleY: 2, duration: 500, onComplete: () => effect.destroy() })
          this.createParticles(unit.x, unit.y - 20, 'heal')
          this.playSfx('heal')
        } else if (powerUp.type === 'ammo') {
          // Restore ammo
          if (isPlayerTeam) {
            this.weaponAmmo.grenade = Math.min(5, this.weaponAmmo.grenade + 2)
            this.weaponAmmo.rifle = Math.min(15, this.weaponAmmo.rifle + 5)
            this.weaponAmmo.bazooka = Math.min(3, this.weaponAmmo.bazooka + 1)
          } else {
            this.cpuWeaponAmmo.grenade = Math.min(5, this.cpuWeaponAmmo.grenade + 2)
            this.cpuWeaponAmmo.rifle = Math.min(15, this.cpuWeaponAmmo.rifle + 5)
            this.cpuWeaponAmmo.bazooka = Math.min(3, this.cpuWeaponAmmo.bazooka + 1)
          }
          
          // Ammo collection effect
          const effect = this.add.circle(unit.x, unit.y - 20, 15, 0xffff00)
          this.tweens.add({ targets: effect, alpha: 0, scaleX: 2, scaleY: 2, duration: 500, onComplete: () => effect.destroy() })
          this.createParticles(unit.x, unit.y - 20, 'collect')
          this.playSfx('collect')
        }
        
        this.playSfx('explosion') // Reuse explosion sound for collection
      }


      // Unit class system
      getUnitClass(team: 'A'|'B', index: number): 'soldier'|'sniper'|'heavy'|'medic' {
        return team === 'A' ? this.teamAClasses[index] : this.teamBClasses[index]
      }

      getClassModifiers(unitClass: 'soldier'|'sniper'|'heavy'|'medic') {
        switch (unitClass) {
          case 'soldier':
            return { health: 100, accuracy: 1.0, speed: 1.0, damage: 1.0 }
          case 'sniper':
            return { health: 80, accuracy: 1.3, speed: 0.8, damage: 1.5 }
          case 'heavy':
            return { health: 150, accuracy: 0.7, speed: 0.6, damage: 1.2 }
          case 'medic':
            return { health: 90, accuracy: 0.9, speed: 1.1, damage: 0.8 }
          default:
            return { health: 100, accuracy: 1.0, speed: 1.0, damage: 1.0 }
        }
      }

      applyClassAbilities(unit: any, team: 'A'|'B', index: number) {
        const unitClass = this.getUnitClass(team, index)
        const modifiers = this.getClassModifiers(unitClass)
        
        // Apply visual differences based on class by changing the fill color
        if (unitClass === 'sniper') {
          unit.setFillStyle(0x87CEEB) // Light blue for sniper
        } else if (unitClass === 'heavy') {
          unit.setFillStyle(0x8B4513) // Brown for heavy
        } else if (unitClass === 'medic') {
          unit.setFillStyle(0x00FF00) // Green for medic
        } else {
          // Keep original color for soldier
          if (team === 'A') {
            unit.setFillStyle(0xff0000) // Red for player team
          } else {
            unit.setFillStyle(0x0000ff) // Blue for enemy team
          }
        }
      }

      // HUD text removed in favor of React overlay

      create() {
        // Debug marker to confirm scene is running
        // eslint-disable-next-line no-console
        console.log('[TW] Phaser scene create()')
        
        // Report scene creation
        if (typeof addBugReport === 'function') {
          addBugReport('Phaser scene created successfully', 'low', 'system')
        }
        
        // Add Phaser-specific error detection
        this.events.on('error', (error: any) => {
          if (typeof addBugReport === 'function') {
            addBugReport(`Phaser Error: ${error.message || error}`, 'high', 'system')
          }
        })
        const w = this.scale.width
        const h = this.scale.height
        // Background sky + water bands (darker, grittier)
        const bg = this.add.graphics()
        bg.fillStyle(0x4a5568, 1).fillRect(0, 0, w, h)
        bg.fillStyle(0x2d3748, 1).fillRect(0, h*0.55, w, h*0.45)
        // Add fog overlay for depth
        const fog = this.add.graphics()
        fog.fillStyle(0x718096, 0.3).fillRect(0, 0, w, h)
        // Darker storm clouds
        const drawCloud = (cx:number, cy:number, s:number) => {
          const c = this.add.graphics()
          c.fillStyle(0x4a5568, 0.8)
          c.fillCircle(cx, cy, 20*s)
          c.fillCircle(cx+20*s, cy+5*s, 24*s)
          c.fillCircle(cx-18*s, cy+8*s, 18*s)
          c.fillCircle(cx+42*s, cy+10*s, 16*s)
          // Add darker cloud shadows
          c.fillStyle(0x2d3748, 0.6)
          c.fillCircle(cx+5*s, cy+8*s, 18*s)
          c.fillCircle(cx+25*s, cy+12*s, 20*s)
          this.clouds.push(c)
        }
        drawCloud(120, 90, 1.2); drawCloud(300, 70, 1.0); drawCloud(520, 100, 1.3); drawCloud(780, 80, 1.1)

        // Ground island (render texture for simple destructible visuals)
        this.ground = this.add.rectangle(w/2, h-40, w, 80, 0x1a2230).setOrigin(0.5)
        // Create teams (3 per side) - Make them visible
        // Create simple invisible placeholder units with required methods
        const marginX = 120
        const groundY = h - 100
        const spacing = 80

        // Helper to create a placeholder unit with working data store
        const makeUnit = (x:number, y:number) => {
          const store: Record<string, any> = {}
          return {
            x, y,
            getData: (k?: string) => (k ? store[k] : null),
            setData: (k: string, v: any) => { store[k] = v; return this as any },
            setFillStyle: () => this as any,
            setStrokeStyle: () => this as any,
            setScale: () => this as any,
            setAlpha: () => this as any,
            setDepth: () => this as any,
            setRotation: () => this as any,
            setInteractive: () => this as any,
            visible: true,
          } as any
        }

        this.teamA = [
          makeUnit(marginX, groundY),
          makeUnit(marginX + spacing, groundY),
          makeUnit(marginX + spacing * 2, groundY),
        ]
        this.teamB = [
          makeUnit(w - marginX - spacing * 2, groundY),
          makeUnit(w - marginX - spacing, groundY),
          makeUnit(w - marginX, groundY),
        ]
        
        // Apply class abilities to units (now safe since we have all required methods)
        this.teamA.forEach((unit, i) => {
          this.applyClassAbilities(unit, 'A', i)
        })
        this.teamB.forEach((unit, i) => {
          this.applyClassAbilities(unit, 'B', i)
        })
        this.player = this.teamA[this.playerIdx]
        this.enemy = this.teamB[this.enemyIdx]
        
        // Add walking animation data to all units
        this.teamA.forEach(unit => {
          unit.setData('walking', false)
          unit.setData('walkCycle', 0)
        })
        this.teamB.forEach(unit => {
          unit.setData('walking', false)
          unit.setData('walkCycle', 0)
        })
        
        this.cursors = this.input.keyboard!.createCursorKeys()
        this.keyA = this.input.keyboard!.addKey('A')
        this.keyD = this.input.keyboard!.addKey('D')
        this.keyQ = this.input.keyboard!.addKey('Q')
        this.keyE = this.input.keyboard!.addKey('E')
        this.keyT = this.input.keyboard!.addKey('T')
        this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        this.keyW = this.input.keyboard!.addKey('W')
        this.input.keyboard!.on('keydown-ONE', () => { this.weapon = 'grenade'; setUiWeapon('grenade'); setUseBoot(false) })
        this.input.keyboard!.on('keydown-TWO', () => { this.weapon = 'rifle'; setUiWeapon('rifle'); setUseBoot(false) })
        this.input.keyboard!.on('keydown-THREE', () => { setUseBoot(true) })
        this.input.keyboard!.on('keydown-FIVE', () => { this.weapon = 'bazooka'; setUiWeapon('bazooka'); setUseBoot(false) })
        this.input.keyboard!.on('keydown-FOUR', () => { setTurnColor(turnColorRef.current==='blue'?'red':'blue'); setTurnMs(30000) })
        // Mouse: hold to charge, release to fire
        this.input.on('pointerdown', () => { this.charging = true })
        this.input.on('pointerup', () => { this.fire() })
        this.input.on('pointerout', () => { this.charging = false })
        // timer above active unit
        this.activeTimerText = this.add.text(this.player.x, this.player.y - 86, '', { color: '#ffffff' }).setOrigin(0.5).setDepth(10)
      }

      update() {
        try {
          // Sync active units based on current turn
          if (turnColorRef.current !== this.lastTurn) {
            this.lastTurn = turnColorRef.current
            if (this.lastTurn === 'blue') this.playerIdx = (this.playerIdx + 1) % this.teamA.length
            else this.enemyIdx = (this.enemyIdx + 1) % this.teamB.length
            // Reset steps on turn change
            this.stepsRemaining = this.maxSteps
            this.stepsUsed = 0
          }
          
          this.player = this.teamA[this.playerIdx]
          this.enemy = this.teamB[this.enemyIdx]

        // Static clouds - no parallax movement
        // Clouds stay in fixed positions for proper background effect

        // Territory Wars style: fixed-speed walking and per-step distance cost
        // sync weapon from React UI
        this.weapon = weaponRef.current
        const walkSpeed = 2.2 // closer to TW pace
        const stepPixels = 70 // TW-like step consumption
        let vx = 0
        const wantLeft = this.cursors.left?.isDown || this.keyA.isDown
        const wantRight = this.cursors.right?.isDown || this.keyD.isDown

        // Will compute grounded later; initialize then refine
        let grounded = false
        // Angle adjust with Q/E for small keyboards
        if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
          const next = Math.max(10, Math.min(80, angleRef.current - 2))
          setAngle(next)
        } else if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          const next = Math.max(10, Math.min(80, angleRef.current + 2))
          setAngle(next)
        }
        if (this.charging) this.power = Math.min(100, this.power + 1.8)

        // simple gravity + ground/platform collision for jump
        const groundTop = (this.scale.height - 80)
        const groundY = groundTop - 20 // player center when standing on ground (40px tall)
        
        // Store groundTop for use in other parts of update
        this.groundTop = groundTop
        const jumpVelocity = -13.8
        this.player.setData('vy', (this.player.getData('vy') ?? 0) + 0.42)
        let vy = this.player.getData('vy')
        this.player.y += vy
        grounded = false
        // collide with platforms (solid)
        for (const p of this.platforms) {
          const top = p.y - (p.height/2)
          const left = p.x - (p.width/2)
          const right = p.x + (p.width/2)
          // top landing
          if (this.player.y <= top && this.player.y + 20 >= top && this.player.x >= left && this.player.x <= right && vy > 0) {
            this.player.y = top - 20
            this.player.setData('vy', 0)
            grounded = true
          }
          // block from below (head bump)
          const bottom = p.y + (p.height/2)
          if (this.player.y - 20 <= bottom && this.player.y > bottom && this.player.x >= left && this.player.x <= right && vy < 0) {
            this.player.y = bottom + 20
            this.player.setData('vy', 0)
          }
        }
        if (this.player.y >= groundY) {
          this.player.y = groundY
          this.player.setData('vy', 0)
          grounded = true
        }
        // jump on Space/W when grounded
        if (grounded && (Phaser.Input.Keyboard.JustDown(this.keySpace) || Phaser.Input.Keyboard.JustDown(this.keyW))) {
          this.player.setData('vy', jumpVelocity)
          this.playSfx('jump')
        }

        // Player turn movement (only if game is playing)
        if (this.gameState === 'playing' && this.isPlayerTurn && this.stepsRemaining > 0) {
          const moving = (wantLeft || wantRight)
          if (moving) {
            vx = (wantLeft ? -walkSpeed : 0) + (wantRight ? walkSpeed : 0)
            this.playerFacing = wantLeft ? -1 : (wantRight ? 1 : this.playerFacing)
          }
          const oldX = this.player.x
          this.player.x += vx
          const dx = Math.abs(this.player.x - oldX)
          // Accumulate distance and spend steps per stepPixels
          if (moving && dx > 0) {
            this.stepDistanceAcc += dx
            while (this.stepDistanceAcc >= stepPixels && this.stepsRemaining > 0) {
              this.stepsRemaining = Math.max(0, this.stepsRemaining - 1)
              this.stepsUsed = this.maxSteps - this.stepsRemaining
              this.stepDistanceAcc -= stepPixels
            }
            // Walking anim tick
            this.player.setData('walking', true)
            this.player.setData('walkCycle', (this.player.getData('walkCycle') + 0.25) % (Math.PI * 2))
          } else {
            this.player.setData('walking', false)
          }
        } else if (this.isPlayerTurn) {
          // No steps remaining - stop movement
          vx = 0
        }
        
        // CPU turn movement (only if game is playing)
        if (this.gameState === 'playing' && !this.isPlayerTurn && this.cpuStepsRemaining > 0) {
          this.cpuAI()
        }
        
        // Clamp within screen (no wrap)
        this.player.x = Math.max(10, Math.min(this.scale.width - 10, this.player.x))
        this.player.setData('vx', vx)
        
        // Auto-end turn when steps are exhausted
        if (this.stepsRemaining <= 0 && this.isPlayerTurn) {
          this.endPlayerTurn()
        }
        if (this.cpuStepsRemaining <= 0 && !this.isPlayerTurn) {
          this.endCPUTurn()
        }

        // Basic enemy gravity and platform collision
        this.enemy.setData('vy', (this.enemy.getData('vy') ?? 0) + 0.35)
        const evy = this.enemy.getData('vy')
        this.enemy.y += evy
        for (const p of this.platforms) {
          const top = p.y - (p.height/2)
          const left = p.x - (p.width/2)
          const right = p.x + (p.width/2)
          if (this.enemy.y <= top && this.enemy.y + 20 >= top && this.enemy.x >= left && this.enemy.x <= right && evy > 0) {
            this.enemy.y = top - 20
            this.enemy.setData('vy', 0)
          }
        }
        const enemyGroundY = groundY
        if (this.enemy.y >= enemyGroundY) {
          this.enemy.y = enemyGroundY
          this.enemy.setData('vy', 0)
        }

        // Minimal overlay rendering: draw only active player and enemy stick figures
        if (!this.stickLayer) {
          this.stickLayer = this.add.layer().setDepth(1000)
        }
        this.stickLayer.removeAll(true)
        const drawSimpleStick = (x:number, y:number, color:number, highlight:boolean) => {
          const g = this.add.graphics().setData('tag','stick')
          // Classic outline style: no fill, thinner lines, no shadow
          const headY = y - 28
          const lineW = 2
          g.lineStyle(lineW, color, 1)
          // head (outline only)
          g.strokeCircle(x, headY, 6)
          // torso
          g.lineBetween(x, headY + 6, x, y)
          // arms
          g.lineBetween(x, headY + 10, x - 11, headY + 18)
          g.lineBetween(x, headY + 10, x + 11, headY + 18)
          // legs
          g.lineBetween(x, y, x - 8, y + 14)
          g.lineBetween(x, y, x + 8, y + 14)
          // subtle highlight ring
          if (highlight) {
            g.lineStyle(1, 0xfde68a, 0.8)
            g.strokeCircle(x, headY, 9)
          }
          this.stickLayer!.add(g)
        }
        // Draw player and enemy only with subtle team colors
        const colorBlue = 0x3b82f6 // blue-500
        const colorRed = 0xef4444  // red-500
        drawSimpleStick(this.player.x, this.player.y, colorBlue, true)
        drawSimpleStick(this.enemy.x, this.enemy.y, colorRed, false)

        // Kick mechanic: press K or [3] boot near closest enemy to knockback
        const keyK = this.input.keyboard!.addKey('K')
        if ((useBoot || Phaser.Input.Keyboard.JustDown(keyK)) && this.time.now - this.lastKickAt > 350) {
          // find closest enemy to player among teamB
          let bestIdx = 0
          let bestDist = Number.POSITIVE_INFINITY
          this.teamB.forEach((u, idx) => {
            const d = Math.hypot(u.x - this.player.x, u.y - this.player.y)
            if (d < bestDist) { bestDist = d; bestIdx = idx }
          })
          const target = this.teamB[bestIdx]
          const dx = target.x - this.player.x
          const dy = target.y - this.player.y
          const dist = Math.hypot(dx, dy)
          if (dist < 36 && Math.abs(dy) < 24) {
            const dir = Math.sign(dx) || 1
            target.setData('vy', -6)
            target.x += dir * 28
            this.teamBHP[bestIdx] = Math.max(0, this.teamBHP[bestIdx] - 10)
            if (bestIdx === this.enemyIdx) this.enemyHP = Math.min(this.teamBHP[bestIdx], this.enemyHP)
            this.lastKickAt = this.time.now
            this.playSfx('shot')
            // Boot stomp effect
            const stomp = this.add.circle(this.player.x, this.player.y + 10, 12, 0x8b4513)
            this.tweens.add({ targets: stomp, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 200, onComplete: () => stomp.destroy() })
          }
          setUseBoot(false)
        }

        // Edge fall: if enemy/player leaves bounds horizontally, simulate fall (remove)
        const outLeft = -40, outRight = this.scale.width + 40
        if (this.enemy.x < outLeft || this.enemy.x > outRight || this.enemy.y > this.scale.height + 40) {
          this.enemy.setFillStyle(0x888888)
          this.enemyHP = 0
        }
        if (this.player.x < outLeft || this.player.x > outRight || this.player.y > this.scale.height + 40) {
          this.player.setFillStyle(0x888888)
          this.playerHP = 0
        }

        // KO handling for active only (simple feedback)
        const handleKO = (who: 'player' | 'enemy') => {
          const target = who === 'player' ? this.player : this.enemy
          const text = this.add.text(target.x, target.y - 60, 'KO!', { color: '#f87171', fontStyle: 'bold' }).setOrigin(0.5)
          this.tweens.add({ targets: text, y: text.y - 20, alpha: 0, duration: 600, onComplete: () => text.destroy() })
          this.playSfx('explosion')
          setTurnColor(c => (c === 'blue' ? 'red' : 'blue'))
          setTurnMs(30000)
        }
        // Check for unit deaths and handle KOs
        this.checkUnitDeaths()
        
        // Power-up system
        this.powerUpSpawnTimer++
        if (this.powerUpSpawnTimer > 3000 && this.powerUps.length < 3) { // Spawn every 5 seconds, max 3 power-ups
          this.spawnPowerUp()
          this.powerUpSpawnTimer = 0
        }
        this.checkPowerUpCollection()
        

        // Minimal HUD: remove power bars, angle, and range clutter
        this.children.getAll().forEach(o => {
          const go = o as any
          if (go.getData && ['power','angle','range'].includes(go.getData('tag'))) o.destroy()
        })
        
        // Draw weapon range indicator when charging
        if (this.charging) {
          this.drawWeaponRange()
        }

        // Minimal HUD: remove HP bars entirely
        this.children.getAll().forEach(o => { const go=o as any; if (go.getData && go.getData('tag')==='hp') o.destroy() })

        // HUD handled by React overlay
        
        // Remove non-playable stick figures: do not render any overlay figures
        // Intentionally skip creating stick layers and drawing any units here

        // Update active timer text position/value
        if (this.activeTimerText) {
          const who = turnColorRef.current === 'blue' ? this.player : this.enemy
          this.activeTimerText.setPosition(who.x, who.y - 86)
          this.activeTimerText.setText(`${(turnMs/1000).toFixed(1)}s`)
        }
        
        // No graphics rendering - clean game

        // Projectile collisions with terrain for bounce/ricochet
        const reflect = (vx: number, vy: number, normal: 'x'|'y', elasticity: number) => {
          return normal === 'x' ? { vx: -vx * elasticity, vy } : { vx, vy: -vy * elasticity }
        }
        // grenades bounce on ground and platforms
        this.grenades = this.grenades.filter(it => it.g && (it.g as any).active)
        for (const item of this.grenades) {
          const body = item.g.body
          if (!body) continue
          const now = this.time.now
          const canBounce = (now - item.lastBounceTs) > 50 // debounce to avoid loop
          // ground
          const r = (item.g as any).radius || 5
          if (canBounce && item.g.y + r >= this.groundTop - 1 && body.velocity.y > 0) {
            item.g.y = this.groundTop - r - 1
            const rv = reflect(body.velocity.x, body.velocity.y, 'y', 0.6)
            body.setVelocity(rv.vx, Math.min(rv.vy, -80)) // ensure upward separation
            item.lastBounceTs = now
          }
          // platforms
          for (const p of this.platforms) {
            const px = p.x - p.width/2, py = p.y - p.height/2
            const nx = Math.max(px, Math.min(item.g.x, px + p.width))
            const ny = Math.max(py, Math.min(item.g.y, py + p.height))
            const dx = item.g.x - nx, dy = item.g.y - ny
            if (canBounce && dx*dx + dy*dy <= r*r) {
              const normalIsY = Math.abs(body.velocity.y) > Math.abs(body.velocity.x)
              const rv = reflect(body.velocity.x, body.velocity.y, normalIsY ? 'y' : 'x', 0.6)
              body.setVelocity(rv.vx, rv.vy)
              // separate one pixel along normal to prevent re-collide
              if (normalIsY) {
                if (item.g.y < p.y) item.g.y = (p.y - p.height/2) - r - 1; else item.g.y = (p.y + p.height/2) + r + 1
              } else {
                if (item.g.x < p.x) item.g.x = (p.x - p.width/2) - r - 1; else item.g.x = (p.x + p.width/2) + r + 1
              }
              item.lastBounceTs = now
            }
          }
        }
        // bullets ricochet limited times + damage on first unit hit
        this.bullets = this.bullets.filter(it => it.b && (it.b as any).active)
        for (const item of this.bullets) {
          const body = item.b.body
          if (!body) continue
          // ground ricochet shallow
          if (item.b.y + 1 >= this.groundTop && body.velocity.y > 0 && item.ric > 0) {
            const rv = reflect(body.velocity.x, body.velocity.y, 'y', 0.9)
            body.setVelocity(rv.vx, rv.vy)
            item.ric -= 1
          }
          // hit detection (simple AABB for enemy and player)
          const hitRect = (rx:number, ry:number, rw:number, rh:number) => {
            const bx = item.b.x - 4, by = item.b.y - 1, bw = 8, bh = 2
            return bx < rx + rw && bx + bw > rx && by < ry + rh && by + bh > ry
          }
          // check all enemy team units first; damage the first collided and stop
          let hitSomething = false
          for (let i = 0; i < this.teamB.length; i++) {
            const u = this.teamB[i]
            if (hitRect(u.x - 10, u.y - 20, 20, 40)) {
              // Check line of sight before damaging
              if (this.hasLineOfSight(item.b.x, item.b.y, u.x, u.y)) {
                const isHead = item.b.y <= u.y - 20 + 13
                const dmg = isHead ? 35 : 20
                if (i === this.enemyIdx) {
                  this.enemyHP = Math.max(0, this.enemyHP - dmg)
                }
                this.teamBHP[i] = Math.max(0, this.teamBHP[i] - dmg)
                // Hit flash effect
                const hitFlash = this.add.circle(u.x, u.y - 15, 6, 0xff0000)
                this.tweens.add({ targets: hitFlash, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 150, onComplete: () => hitFlash.destroy() })
                this.createParticles(u.x, u.y - 15, 'hit')
                this.playSfx('hit')
                hitSomething = true
                break
              }
            }
          }
          // also allow friendly fire for testing (optional)
          if (!hitSomething) {
            for (let i = 0; i < this.teamA.length; i++) {
              const u = this.teamA[i]
              if (hitRect(u.x - 10, u.y - 20, 20, 40)) {
                const isHead = item.b.y <= u.y - 20 + 13
                const dmg = isHead ? 35 : 20
                if (i === this.playerIdx) {
                  this.playerHP = Math.max(0, this.playerHP - dmg)
                }
                this.teamAHP[i] = Math.max(0, this.teamAHP[i] - dmg)
                hitSomething = true
                break
              }
            }
          }
          if (hitSomething) {
            (item.b as any).destroy()
            item.ric = 0
            continue
          }
          for (const p of this.platforms) {
            const px = p.x - p.width/2, py = p.y - p.height/2
            const rx = item.b.x - 4, ry = item.b.y - 1, rw = 8, rh = 2
            if (rx < px + p.width && rx + rw > px && ry < py + p.height && ry + rh > py && item.ric > 0) {
              const normal: 'x'|'y' = Math.abs(body.velocity.y) > Math.abs(body.velocity.x) ? 'y' : 'x'
              const rv = reflect(body.velocity.x, body.velocity.y, normal, 0.9)
              body.setVelocity(rv.vx, rv.vy)
              item.ric -= 1
            }
          }
        }
        
        } catch (error) {
          // Report errors to bug system
          if (typeof addBugReport === 'function') {
            addBugReport(`Update error: ${error instanceof Error ? error.message : String(error)}`, 'high', 'gameplay', error instanceof Error ? error.stack : undefined)
          }
          console.error('Update error:', error)
        }
        
        // Additional real-time error detection
        try {
          // Check for invalid game states
          if (this.playerIdx < 0 || this.playerIdx >= this.teamA.length) {
            addBugReport(`Invalid player index: ${this.playerIdx}`, 'high', 'gameplay')
          }
          
          if (this.enemyIdx < 0 || this.enemyIdx >= this.teamB.length) {
            addBugReport(`Invalid enemy index: ${this.enemyIdx}`, 'high', 'gameplay')
          }
          
          // Check for NaN values
          if (isNaN(this.player.x) || isNaN(this.player.y)) {
            addBugReport(`Player position is NaN: x=${this.player.x}, y=${this.player.y}`, 'critical', 'gameplay')
          }
          
          if (isNaN(this.enemy.x) || isNaN(this.enemy.y)) {
            addBugReport(`Enemy position is NaN: x=${this.enemy.x}, y=${this.enemy.y}`, 'critical', 'gameplay')
          }
          
          // Check for infinite values
          if (!isFinite(this.player.x) || !isFinite(this.player.y)) {
            addBugReport(`Player position is infinite: x=${this.player.x}, y=${this.player.y}`, 'critical', 'gameplay')
          }
          
          // Check for null/undefined units
          if (!this.player) {
            addBugReport('Player unit is null/undefined', 'critical', 'gameplay')
          }
          
          if (!this.enemy) {
            addBugReport('Enemy unit is null/undefined', 'critical', 'gameplay')
          }
          
          // Check for invalid weapon states
          if (this.weapon && !['grenade', 'rifle', 'bazooka'].includes(this.weapon)) {
            addBugReport(`Invalid weapon: ${this.weapon}`, 'medium', 'gameplay')
          }
          
          // Check for invalid game state
          if (this.gameState && !['playing', 'gameOver', 'playerWins', 'cpuWins'].includes(this.gameState)) {
            addBugReport(`Invalid game state: ${this.gameState}`, 'medium', 'gameplay')
          }
          
        } catch (detectionError) {
          if (typeof addBugReport === 'function') {
            addBugReport(`Error detection failed: ${detectionError}`, 'low', 'system')
          }
        }
      }

      fire() {
        if (!this.charging || this.gameState !== 'playing') return
        this.charging = false
        const p = this.power
        this.power = 0
        const angle = Phaser.Math.DegToRad(angleRef.current)
        
        // Consume ammo
        if (this.isPlayerTurn) {
          if (this.weaponAmmo[this.weapon] <= 0) return
          this.weaponAmmo[this.weapon]--
        } else {
          if (this.cpuWeaponAmmo[this.weapon] <= 0) return
          this.cpuWeaponAmmo[this.weapon]--
        }
        if (this.weapon === 'grenade') {
          const vel = 80 + p * 2.2
          const windEffect = wind * 0.5 // Wind affects grenades more
          const vx = Math.cos(angle) * vel + windEffect
          const vy = -Math.sin(angle) * vel
          const circ = this.add.circle(this.player.x, this.player.y - 30, 5, 0xf59e0b) as any
          this.tweens.addCounter({ from: 0, to: 1, duration: 2500, onComplete: () => {
            // damage calculation
            const ex = circ.x, ey = circ.y
            const radius = 60
            const applyExplosion = (rx:number, ry:number, team:'A'|'B', idx:number) => {
              const dx = rx - ex, dy = ry - ey
              const dist = Math.hypot(dx, dy)
              if (dist <= radius) {
                let dmg = Math.round((1 - dist / radius) * 40) // up to 40 dmg near center
                
                // Apply cover damage reduction
                const attackerX = this.player.x
                const attackerY = this.player.y
                if (this.isInCover(rx, ry, attackerX, attackerY)) {
                  dmg = Math.round(dmg * 0.5) // 50% damage reduction in cover
                }
                
                if (team === 'B') {
                  if (idx === this.enemyIdx) this.enemyHP = Math.max(0, this.enemyHP - dmg)
                  this.teamBHP[idx] = Math.max(0, this.teamBHP[idx] - dmg)
                } else {
                  if (idx === this.playerIdx) this.playerHP = Math.max(0, this.playerHP - dmg)
                  this.teamAHP[idx] = Math.max(0, this.teamAHP[idx] - dmg)
                }
                // knockback
                const nx = dx / (dist || 1), ny = dy / (dist || 1)
                const target = team === 'B' ? this.teamB[idx] : this.teamA[idx]
                target.setData('vy', -6 * Math.abs(ny))
                target.x += nx * 20
              }
            }
            this.teamB.forEach((u, i) => applyExplosion(u.x, u.y, 'B', i))
            this.teamA.forEach((u, i) => applyExplosion(u.x, u.y, 'A', i))
            // cleanup visuals
            this.grenades = this.grenades.filter(it => it.g !== circ)
            circ.destroy()
            const boom = this.add.circle(ex, ey, 24, 0xff4444)
            this.tweens.add({ targets: boom, alpha: 0, duration: 300, onComplete: () => boom.destroy() })
            this.playSfx('explosion')
            this.cameras.main.shake(120, 0.004)
            // Destructible terrain - damage platforms
            for (let i = this.platforms.length - 1; i >= 0; i--) {
              const platform = this.platforms[i]
              const dx = platform.x - ex
              const dy = platform.y - ey
              const dist = Math.hypot(dx, dy)
              
              if (dist <= radius) {
                // Platform takes damage
                const damage = Math.round((1 - dist / radius) * 50)
                const currentHealth = platform.getData('health') || 100
                const newHealth = Math.max(0, currentHealth - damage)
                platform.setData('health', newHealth)
                
                if (newHealth <= 0) {
                  // Platform destroyed
                  const gfx = platform.getData('gfx')
                  if (gfx) gfx.destroy()
                  platform.destroy()
                  this.platforms.splice(i, 1)
                  
                  // Explosion effect on platform
                  const boom = this.add.circle(platform.x, platform.y, 30, 0xff4444)
                  this.tweens.add({ targets: boom, alpha: 0, duration: 400, onComplete: () => boom.destroy() })
                } else {
                  // Platform damaged but not destroyed
                  const gfx = platform.getData('gfx')
                  if (gfx) {
                    gfx.clear()
                    const damageAlpha = newHealth / 100
                    gfx.fillStyle(0x6b4c1f, damageAlpha).fillRoundedRect(platform.x - platform.width/2, platform.y - platform.height/2, platform.width, platform.height, 6)
                    gfx.lineStyle(2, 0x4e3616, damageAlpha).strokeRoundedRect(platform.x - platform.width/2, platform.y - platform.height/2, platform.width, platform.height, 6)
                  }
                }
              }
            }
            
          }})
          this.physics.add.existing(circ)
          const body = (circ.body) as Phaser.Physics.Arcade.Body
          body.setCollideWorldBounds(true)
          body.setBounce(0.6)
          body.setVelocity(vx, vy)
          body.setGravityY(500)
          this.grenades.push({ g: circ, lastBounceTs: 0 })
        } else if (this.weapon === 'rifle') {
          // rifle: fast projectile with wind/accuracy
          const vel = 650
          const windEffect = wind * 0.3 // Wind affects rifle less than grenades
          const accuracy = 0.95 + (Math.random() - 0.5) * 0.1 // Base accuracy
          
          const bullet = this.add.rectangle(this.player.x, this.player.y - 30, 10, 2, 0xffffff) as any
          this.physics.add.existing(bullet)
          const body = (bullet.body) as Phaser.Physics.Arcade.Body
          body.setAllowGravity(false)
          // Rifle fires with wind and accuracy effects
          body.setVelocity(this.playerFacing * vel * accuracy + windEffect, 0)
          this.time.delayedCall(1000, () => { this.bullets = this.bullets.filter(it => it.b !== bullet); bullet.destroy() })
          this.bullets.push({ b: bullet, ric: 2 })
          this.playSfx('shot')
          // Muzzle flash effect
          const flash = this.add.circle(this.player.x + (this.playerFacing * 15), this.player.y - 20, 8, 0xffff00)
          this.tweens.add({ targets: flash, alpha: 0, scaleX: 2, scaleY: 2, duration: 100, onComplete: () => flash.destroy() })
        } else if (this.weapon === 'bazooka') {
          // bazooka: rocket projectile with explosion
          const vel = 400
          const windEffect = wind * 0.4 // Wind affects bazooka moderately
          const vx = Math.cos(angle) * vel + windEffect
          const vy = -Math.sin(angle) * vel
          const rocket = this.add.rectangle(this.player.x, this.player.y - 30, 12, 4, 0xff6600) as any
          this.physics.add.existing(rocket)
          const body = (rocket.body) as Phaser.Physics.Arcade.Body
          body.setAllowGravity(true)
          body.setVelocity(vx, vy)
          body.setGravityY(200)
          
          // Rocket trail effect
          const trail = this.add.graphics()
          this.tweens.add({ 
            targets: trail, 
            alpha: 0, 
            duration: 2000, 
            onComplete: () => trail.destroy() 
          })
          
          this.time.delayedCall(3000, () => {
            // Rocket explodes after 3 seconds or on impact
            const ex = rocket.x, ey = rocket.y
            const radius = 80
            const applyExplosion = (rx:number, ry:number, team:'A'|'B', idx:number) => {
              const dx = rx - ex, dy = ry - ey
              const dist = Math.hypot(dx, dy)
              if (dist <= radius) {
                let dmg = Math.round((1 - dist / radius) * 60) // up to 60 dmg near center
                
                // Apply cover damage reduction
                const attackerX = this.player.x
                const attackerY = this.player.y
                if (this.isInCover(rx, ry, attackerX, attackerY)) {
                  dmg = Math.round(dmg * 0.5) // 50% damage reduction in cover
                }
                
                if (team === 'B') {
                  if (idx === this.enemyIdx) this.enemyHP = Math.max(0, this.enemyHP - dmg)
                  this.teamBHP[idx] = Math.max(0, this.teamBHP[idx] - dmg)
                } else {
                  if (idx === this.playerIdx) this.playerHP = Math.max(0, this.playerHP - dmg)
                  this.teamAHP[idx] = Math.max(0, this.teamAHP[idx] - dmg)
                }
                // knockback
                const nx = dx / (dist || 1), ny = dy / (dist || 1)
                const target = team === 'B' ? this.teamB[idx] : this.teamA[idx]
                target.setData('vy', -8 * Math.abs(ny))
                target.x += nx * 30
              }
            }
            this.teamB.forEach((u, i) => applyExplosion(u.x, u.y, 'B', i))
            this.teamA.forEach((u, i) => applyExplosion(u.x, u.y, 'A', i))
            
            // Visual explosion
            const boom = this.add.circle(ex, ey, 40, 0xff4444)
            this.tweens.add({ targets: boom, alpha: 0, duration: 400, onComplete: () => boom.destroy() })
            this.createParticles(ex, ey, 'explosion')
            this.playSfx('explosion')
            this.cameras.main.shake(200, 0.006)
            
            rocket.destroy()
          })
          
          this.playSfx('shot')
          // Muzzle flash effect
          const flash = this.add.circle(this.player.x + (this.playerFacing * 20), this.player.y - 20, 12, 0xffaa00)
          this.tweens.add({ targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 150, onComplete: () => flash.destroy() })
        }
      }
    }

    // share angle with scene
    const angleState = { current: 45 }
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      width: 1280,
      height: 720,
      parent: phaserRef.current,
      backgroundColor: '#0b0f17',
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
      scene: TWScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
      },
    }
    const game = new Phaser.Game(config)
    phaserGameRef.current = game

    // keep angle synced from React state
    const sync = setInterval(() => { (angleState as any).current = angle }, 50)
    
    // sync steps from Phaser to React
    const stepsSync = setInterval(() => {
      if (phaserGameRef.current?.scene?.scenes[0]) {
        const scene = phaserGameRef.current.scene.scenes[0] as any
        if (scene.stepsRemaining !== undefined) {
          setStepsRemaining(scene.stepsRemaining)
          setStepsUsed(scene.stepsUsed)
        }
        if (scene.weaponAmmo !== undefined) {
          setWeaponAmmo(scene.weaponAmmo)
        }
        if (scene.isPlayerTurn !== undefined) {
          setIsPlayerTurn(scene.isPlayerTurn)
        }
        if (scene.gameState !== undefined) {
          setGameState(scene.gameState)
        }
        if (scene.playerScore !== undefined) {
          setPlayerScore(scene.playerScore)
        }
        if (scene.cpuScore !== undefined) {
          setCpuScore(scene.cpuScore)
        }
        if (scene.roundNumber !== undefined) {
          setRoundNumber(scene.roundNumber)
        }
      }
    }, 50) // Increased frequency for better sync
    return () => {
      clearInterval(sync)
      clearInterval(stepsSync)
      try {
        phaserGameRef.current?.destroy(true)
      } finally {
        phaserGameRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear
    ctx.fillStyle = '#0b0f17'
    ctx.fillRect(0, 0, width, height)

    // Ground
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, height - 80, width, 80)

    // Teams
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(60, height - 120, 20, 40)
    ctx.fillRect(100, height - 120, 20, 40)
    ctx.fillRect(140, height - 120, 20, 40)

    ctx.fillStyle = '#ef4444'
    ctx.fillRect(width - 80, height - 120, 20, 40)
    ctx.fillRect(width - 120, height - 120, 20, 40)
    ctx.fillRect(width - 160, height - 120, 20, 40)

    // Wind indicator
    ctx.fillStyle = '#f59e0b'
    ctx.font = '14px sans-serif'
    ctx.fillText(`Wind: ${wind.toFixed(1)} m/s`, 12, 24)

    // Arc preview from current player
    const originX = turn === 'blue' ? 150 : width - 150
    const originY = height - 120
    drawArc(ctx, originX, originY, angle, power, wind)
  }, [angle, power, wind, turn])

  const drawArc = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    angleDeg: number,
    powerPct: number,
    windMs: number
  ) => {
    const gravity = 9.81
    const powerScale = 5 // pixels per unit power
    const v0 = (powerPct / 100) * 60 // initial velocity units
    const theta = (angleDeg * Math.PI) / 180
    const vx = v0 * Math.cos(theta) + windMs * 0.5
    const vy = -v0 * Math.sin(theta)

    ctx.strokeStyle = '#fbbf24'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let t = 0; t <= 2.5; t += 0.05) {
      const x = ox + vx * t * powerScale
      const y = oy + (vy * t + 0.5 * gravity * t * t) * powerScale
      if (t === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  const handleFire = () => {
    if (wager < 1 || wager > hiloTokens) {
      return warning('Invalid wager', 'Adjust your bet amount')
    }
    setBet(wager)
    success('Shot fired!', `${turn.toUpperCase()} wagers ${wager} HILO`)
    setTurn(turn === 'blue' ? 'red' : 'blue')
    // Randomize light wind for next turn
    setWind(((Math.random() - 0.5) * 6))
  }


  return (
    <div className="min-h-screen bg-hilo-black text-white p-6 relative">

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-hilo-gold">Territory Wars (Prototype)</h1>
          <div className="text-sm text-gray-300">Balance: {hiloTokens.toLocaleString()} HILO</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
          <div className="relative">
            <div
              ref={phaserRef}
              className="w-full rounded-lg overflow-hidden"
              style={{ width: '100%', height: 720, aspectRatio: '16/9' }}
            />
            {/* Clean UI overlay - no overlapping gameplay */}
            <div className="pointer-events-none absolute inset-0">
              {/* Top Layer */}
              <div className="absolute top-4 left-4 z-20">
                {/* Hamburger Menu */}
                <div className="pointer-events-auto relative">
                  <button 
                    onClick={() => setMenuOpen(v => !v)}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700/90 to-gray-800/90 border border-gray-600/50 flex flex-col items-center justify-center gap-1.5 hover:from-gray-600/90 hover:to-gray-700/90 active:scale-95 transition-all duration-200 shadow-lg backdrop-blur-sm"
                  >
                    <span className="block w-6 h-0.5 bg-white rounded-full" />
                    <span className="block w-6 h-0.5 bg-white rounded-full" />
                    <span className="block w-6 h-0.5 bg-white rounded-full" />
                  </button>
                  
                  {/* Animated Dropdown Menu */}
                  {menuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-14 left-0 w-72 rounded-2xl bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-gray-600/50 shadow-2xl backdrop-blur-md p-4"
                    >
                      <div className="space-y-3">
                        <div className="text-lg font-bold text-white mb-4">Game Menu</div>
                        
                        <button className="w-full text-left px-4 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 transition-colors text-white">
                          Resume Game
                        </button>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-300 px-2">Settings</div>
                          <div className="space-y-2 px-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-200">Music</span>
                              <div className="w-12 h-6 bg-gray-600 rounded-full relative">
                                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-200">Sound Effects</span>
                              <div className="w-12 h-6 bg-green-500 rounded-full relative">
                                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-200">Fullscreen</span>
                              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs text-white transition-colors">
                                Toggle
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <button className="w-full text-left px-4 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 transition-colors text-white">
                          Controls
                        </button>
                        
                        <button className="w-full text-left px-4 py-3 rounded-xl bg-red-600/50 hover:bg-red-500/50 transition-colors text-white">
                          Exit Game
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Timer - Top Center */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <div className={`px-6 py-3 rounded-2xl text-lg font-bold font-mono tracking-wider border-2 shadow-xl backdrop-blur-sm ${turnColor==='blue' ? 'text-blue-100 border-blue-400/60 bg-gradient-to-br from-blue-600/90 to-blue-800/90' : 'text-red-100 border-red-400/60 bg-gradient-to-br from-red-600/90 to-red-800/90'}`}>
                  {gameState === 'playing' ? (turnMs/1000).toFixed(1) + 's' : 'Game Over'}
                </div>
              </div>

              {/* Score Display - Top Right */}
              <div className="absolute top-4 right-4 z-20 pointer-events-auto">
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl px-4 py-3 border border-gray-600/50 shadow-lg backdrop-blur-sm">
                  <div className="text-sm font-bold text-white text-center mb-1">Score</div>
                  <div className="text-xs text-blue-400">Player: {playerScore}</div>
                  <div className="text-xs text-red-400">CPU: {cpuScore}</div>
                </div>
              </div>


              {/* Control Buttons - Top Right */}
              <div className="absolute top-4 right-4 z-20 pointer-events-auto">
                <div className="flex gap-2">
                  <button
                    onClick={toggleFullscreen}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-105 ${
                      isFullscreen 
                        ? 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600' 
                        : 'bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600'
                    } text-white`}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    {isFullscreen ? '⛶ Exit FS' : '⛶ Fullscreen'}
                  </button>
                  <button
                    onClick={() => setShowTutorial(true)}
                    className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-105"
                  >
                    ❓ Help
                  </button>
                  <button
                    onClick={() => setShowBugReport(!showBugReport)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-105 ${
                      errorCount > 0 
                        ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 animate-pulse' 
                        : 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600'
                    } text-white`}
                  >
                    🐛 Bugs ({bugReports.length}) {errorCount > 0 && `⚠️ ${errorCount}`}
                  </button>
                </div>
              </div>

              {/* Bottom Layer */}
              <div className="absolute bottom-4 left-4 right-4 z-20">
                {/* Player HUD - Bottom Left */}
                <div className="absolute bottom-0 left-0 pointer-events-auto">
                  <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-4 border border-gray-600/50 shadow-xl backdrop-blur-sm min-w-[200px]">
                    <div className="text-lg font-bold text-white mb-2">Player Team</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">P</div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-200">Health</div>
                          <div className="w-32 h-3 rounded-full bg-gray-700">
                            <div className="h-full w-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-3 h-4 bg-gray-600 rounded-sm"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CPU HUD - Bottom Right */}
                <div className="absolute bottom-0 right-0 pointer-events-auto">
                  <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-4 border border-gray-600/50 shadow-xl backdrop-blur-sm min-w-[200px]">
                    <div className="text-lg font-bold text-white mb-2">CPU Team</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">C</div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-200">Health</div>
                          <div className="w-32 h-3 rounded-full bg-gray-700">
                            <div className="h-full w-2/3 bg-gradient-to-r from-red-500 to-red-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-3 h-4 bg-gray-600 rounded-sm"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps Remaining Meter - Above Weapon Tray */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
                  <div className="flex items-center gap-4">
                    <div className={`bg-gradient-to-br from-gray-900/95 to-black/95 rounded-xl px-6 py-3 border-2 shadow-xl backdrop-blur-sm transition-all duration-300 ${
                      stepsRemaining <= 0 ? 'border-red-500/70 shadow-red-500/20' : 
                      stepsRemaining <= 2 ? 'border-yellow-500/70 shadow-yellow-500/20' : 
                      'border-green-500/70 shadow-green-500/20'
                    }`}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-blue-400 text-lg">⚡</span>
                        <div className={`text-sm font-bold ${stepsRemaining <= 0 ? 'text-red-300' : 
                          stepsRemaining <= 2 ? 'text-yellow-300' : 'text-green-300'}`}>
                          {stepsRemaining <= 0 ? 'TURN OVER!' : 'STEPS REMAINING'}
                        </div>
                        <span className="text-blue-400 text-lg">⚡</span>
                      </div>
                      <div className="w-52 h-3 rounded-full bg-gray-800 border border-gray-600 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            stepsRemaining <= 0 
                              ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-600' 
                              : stepsRemaining <= 2
                              ? 'bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-600'
                              : 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-600'
                          }`}
                          style={{ width: `${Math.min((stepsRemaining / maxSteps) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-300 mt-2 text-center font-mono">
                        {Math.round(stepsRemaining)}/{maxSteps} steps
                      </div>
                      {stepsRemaining <= 0 && (
                        <div className="text-red-400 text-xs text-center mt-1 font-bold animate-pulse">
                          🔴 NO MOVEMENT ALLOWED
                        </div>
                      )}
                      {stepsRemaining > 0 && stepsRemaining <= 2 && (
                        <div className="text-yellow-400 text-xs text-center mt-1 font-semibold">
                          ⚠️ LOW STEPS WARNING
                        </div>
                      )}
                    </div>
                    

                    {/* End Turn Button */}
                    {gameState === 'playing' && isPlayerTurn && (
                      <button
                        onClick={() => {
                          if (phaserGameRef.current?.scene?.scenes[0]) {
                            const scene = phaserGameRef.current.scene.scenes[0] as any
                            scene.endPlayerTurn()
                          }
                        }}
                        className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-xl border border-red-500/50 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <div className="text-sm font-bold">End Turn</div>
                        <div className="text-xs opacity-80">Pass to CPU</div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Weapon Tray - Centered Bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-auto">
                  <div className="flex gap-3 bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-3 border border-gray-600/50 shadow-xl backdrop-blur-sm">
                    {[
                      {
                        id: 1, 
                        label: 'Grenade', 
                        active: uiWeapon==='grenade', 
                        on: () => { setUiWeapon('grenade'); weaponRef.current='grenade' },
                        icon: '💣',
                        ammo: weaponAmmo.grenade
                      },
                      {
                        id: 2, 
                        label: 'Gun', 
                        active: uiWeapon==='rifle', 
                        on: () => { setUiWeapon('rifle'); weaponRef.current='rifle' },
                        icon: '🔫',
                        ammo: weaponAmmo.rifle
                      },
                      {
                        id: 3, 
                        label: 'Bazooka', 
                        active: uiWeapon==='bazooka', 
                        on: () => { setUiWeapon('bazooka'); weaponRef.current='bazooka' },
                        icon: '🚀',
                        ammo: weaponAmmo.bazooka
                      },
                      {
                        id: 4, 
                        label: 'Boot', 
                        active: false, 
                        on: () => { setUseBoot(true) },
                        icon: '👢',
                        ammo: weaponAmmo.boot
                      },
                    ].map(btn => (
                      <button 
                        key={btn.id} 
                        onClick={btn.on}
                        disabled={gameState !== 'playing' || btn.ammo <= 0}
                        className={`relative w-16 h-16 rounded-xl border-2 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                          ${btn.active 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/25' 
                            : 'bg-gradient-to-br from-gray-600 to-gray-700 text-gray-200 border-gray-500 hover:from-gray-500 hover:to-gray-600'
                          }`}
                      >
                        <div className="text-2xl">{btn.icon}</div>
                        <span className="text-[10px] font-medium">{btn.label}</span>
                        <div className="absolute top-1 left-1 text-[8px] font-bold opacity-60">
                          [{btn.id}]
                        </div>
                        <div className="absolute bottom-1 right-1 text-[8px] font-bold bg-black/50 rounded px-1">
                          {btn.ammo}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-300 mb-2">Angle: {angle}°</div>
            <input type="range" min={10} max={80} value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-full" />
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-300 mb-2">Power: {power}</div>
            <input type="range" min={10} max={100} value={power} onChange={e => setPower(Number(e.target.value))} className="w-full" />
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-300 mb-2">Wager (HILO)</div>
            <input type="number" min={1} max={hiloTokens} value={wager} onChange={e => setWager(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 flex items-end">
            <div className="text-gray-400 text-sm" />
          </div>
        </div>


        {/* Tutorial Modal */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-600/50 shadow-2xl max-w-2xl mx-4 text-center">
              <div className="text-2xl font-bold text-white mb-6">🎮 Territory Wars Tutorial</div>
              
              {tutorialStep === 0 && (
                <div className="space-y-4">
                  <div className="text-lg text-gray-300">Welcome to Territory Wars!</div>
                  <div className="text-sm text-gray-400 text-left space-y-2">
                    <p>• <strong>Objective:</strong> Eliminate all enemy units to win</p>
                    <p>• <strong>Movement:</strong> Use A/D keys or arrow keys to move</p>
                    <p>• <strong>Weapons:</strong> Select weapons with 1-4 keys or click buttons</p>
                    <p>• <strong>Unit Selection:</strong> Press T to choose which unit to control</p>
                    <p>• <strong>Turn System:</strong> You have limited steps per turn</p>
                  </div>
                </div>
              )}
              
              {tutorialStep === 1 && (
                <div className="space-y-4">
                  <div className="text-lg text-gray-300">Weapons & Combat</div>
                  <div className="text-sm text-gray-400 text-left space-y-2">
                    <p>• <strong>💣 Grenade:</strong> Area damage, affected by wind</p>
                    <p>• <strong>🔫 Rifle:</strong> Fast, accurate, single target</p>
                    <p>• <strong>🚀 Bazooka:</strong> High damage, explosive radius</p>
                    <p>• <strong>👢 Boot:</strong> Melee attack, knockback effect</p>
                    <p>• <strong>Cover:</strong> Hide behind platforms for damage reduction</p>
                  </div>
                </div>
              )}
              
              {tutorialStep === 2 && (
                <div className="space-y-4">
                  <div className="text-lg text-gray-300">Unit Classes</div>
                  <div className="text-sm text-gray-400 text-left space-y-2">
                    <p>• <strong>Soldier:</strong> Balanced stats, all-around fighter</p>
                    <p>• <strong>Sniper:</strong> High accuracy, long range, low health</p>
                    <p>• <strong>Heavy:</strong> High health, close combat specialist</p>
                    <p>• <strong>Medic:</strong> Can heal allies, avoid direct combat</p>
                  </div>
                </div>
              )}
              
              {tutorialStep === 3 && (
                <div className="space-y-4">
                  <div className="text-lg text-gray-300">Strategy & Power-ups</div>
                  <div className="text-sm text-gray-400 text-left space-y-2">
                    <p>• <strong>Power-ups:</strong> Collect health packs and ammo crates</p>
                    <p>• <strong>Terrain:</strong> Use platforms for cover and positioning</p>
                    <p>• <strong>Line of Sight:</strong> Can't shoot through obstacles</p>
                    <p>• <strong>Wind:</strong> Affects projectile trajectory</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all duration-200"
                  disabled={tutorialStep === 0}
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (tutorialStep < 3) {
                      setTutorialStep(tutorialStep + 1)
                    } else {
                      // Require wallet before starting gameplay
                      try {
                        const evt = new CustomEvent('request-wallet-for-feature', { detail: { feature: 'starting Territory Wars' } })
                        window.dispatchEvent(evt)
                      } catch {}
                      setShowTutorial(false)
                      setTutorialStep(0)
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all duration-200"
                >
                  {tutorialStep < 3 ? 'Next' : 'Start Game'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState !== 'playing' && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-600/50 shadow-2xl max-w-md mx-4 text-center">
              <div className="text-4xl font-bold text-white mb-4">
                {gameState === 'playerWins' ? '🎉 You Win!' : '💀 CPU Wins!'}
              </div>
              <div className="text-xl text-gray-300 mb-6">
                Final Score: {playerScore} - {cpuScore}
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (phaserGameRef.current?.scene?.scenes[0]) {
                      const scene = phaserGameRef.current.scene.scenes[0] as any
                      scene.restartGame()
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  Play Again
                </button>
                <button
                  onClick={() => {
                    // Navigate back to main menu or home page
                    window.location.href = '/'
                  }}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  Main Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bug Report Panel */}
        {showBugReport && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBugReport(false)
              }
            }}
          >
            <div className="bg-gray-900 rounded-xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">🐛 Enhanced Bug Reports & Diagnostics</h3>
                  <div className="text-sm text-gray-300 mt-1">
                    Total: <span className="text-blue-400 font-bold">{getAnalyticsData().total}</span>
                    | Unresolved: <span className="text-red-400 font-bold">{getAnalyticsData().unresolved}</span>
                    {lastErrorTime && (
                      <span className="ml-4">
                        Last Error: <span className="text-yellow-400">{lastErrorTime.toLocaleTimeString()}</span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowBugReport(false)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Analytics Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Critical</div>
                  <div className="text-lg font-bold text-red-400">{getAnalyticsData().bySeverity.critical}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400">High</div>
                  <div className="text-lg font-bold text-orange-400">{getAnalyticsData().bySeverity.high}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Medium</div>
                  <div className="text-lg font-bold text-yellow-400">{getAnalyticsData().bySeverity.medium}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Low</div>
                  <div className="text-lg font-bold text-blue-400">{getAnalyticsData().bySeverity.low}</div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Severity:</label>
                  <select 
                    value={filterSeverity} 
                    onChange={(e) => setFilterSeverity(e.target.value as any)}
                    className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Category:</label>
                  <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="ui">UI</option>
                    <option value="gameplay">Gameplay</option>
                    <option value="performance">Performance</option>
                    <option value="network">Network</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search bugs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700 text-white rounded px-2 py-1 text-sm w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Show resolved:</label>
                  <input
                    type="checkbox"
                    checked={showResolved}
                    onChange={(e) => setShowResolved(e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>
              
              {/* Bug Reports List */}
              <div className="space-y-2 mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Issues ({filteredBugReports.length})
                </h4>
                {filteredBugReports.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No bug reports match your filters</p>
                ) : (
                  filteredBugReports.map((report) => (
                    <div key={report.id} className={`p-4 rounded-lg border-l-4 ${
                      report.severity === 'critical' ? 'bg-red-900/20 border-red-500' :
                      report.severity === 'high' ? 'bg-orange-900/20 border-orange-500' :
                      report.severity === 'medium' ? 'bg-yellow-900/20 border-yellow-500' :
                      'bg-blue-900/20 border-blue-500'
                    } ${report.resolved ? 'opacity-60' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 mr-2">
                          <p className="text-white text-sm mb-1">{report.message}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="capitalize">{report.category}</span>
                            <span>•</span>
                            <span>{new Date(report.timestamp).toLocaleString()}</span>
                            {report.resolved && <span className="text-green-400">✓ Resolved</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            report.severity === 'critical' ? 'bg-red-600 text-white' :
                            report.severity === 'high' ? 'bg-orange-600 text-white' :
                            report.severity === 'medium' ? 'bg-yellow-600 text-black' :
                            'bg-blue-600 text-white'
                          }`}>
                            {report.severity.toUpperCase()}
                          </span>
                          <button
                            onClick={() => {
                              setBugReports(prev => {
                                const updated = prev.map(r => 
                                  r.id === report.id ? { ...r, resolved: !r.resolved } : r
                                )
                                saveBugReportsToStorage(updated)
                                return updated
                              })
                            }}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              report.resolved 
                                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                                : 'bg-green-600 hover:bg-green-500 text-white'
                            }`}
                          >
                            {report.resolved ? 'Unresolve' : 'Resolve'}
                          </button>
                          <button
                            onClick={() => copyIndividualBug(report)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            📋 Copy
                          </button>
                        </div>
                      </div>
                      {report.context.screenshot && (
                        <div className="mt-2">
                          <img 
                            src={report.context.screenshot} 
                            alt="Error screenshot" 
                            className="max-w-xs rounded border border-gray-600"
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Copy Bug Report Section */}
              <div className="border-t border-gray-700 pt-4 mb-4">
                <h4 className="text-lg font-semibold text-white mb-3">📋 Export Bug Report</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Copy the complete bug report to share with developers:
                </p>
                <div className="bg-gray-800 rounded-lg p-3 mb-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                    {generateBugReport()}
                  </pre>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyBugReport}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  📋 Copy Full Report
                </button>
                <button
                  onClick={copyAllBugs}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  📝 Copy All Bugs List
                </button>
                <button
                  onClick={() => {
                    setBugReports([])
                    setErrorCount(0)
                    setLastErrorTime(null)
                    localStorage.removeItem('territoryWars_bugReports')
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  🗑️ Clear All
                </button>
                <button
                  onClick={() => setShowBugReport(false)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  ❌ Close
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-xs">
                  💡 <strong>Tip:</strong> Click outside this panel or press <kbd className="bg-gray-700 px-1 rounded">Esc</kbd> to close. 
                  Use "Copy Full Report" to get a complete diagnostic report for sharing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TerritoryWarsPage


