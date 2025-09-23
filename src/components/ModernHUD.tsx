import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Team {
  name: string
  health: number
  maxHealth: number
  color: string
  units: number
  maxUnits: number
}

interface ModernHUDProps {
  playerTeam: Team
  cpuTeam: Team
  currentTurn: 'player' | 'cpu'
  stepsRemaining: number
  maxSteps: number
  weather: string
  timer: number
  onEndTurn: () => void
  onFullscreenToggle: () => void
  isFullscreen: boolean
  className?: string
}

export const ModernHUD: React.FC<ModernHUDProps> = ({
  playerTeam,
  cpuTeam,
  currentTurn,
  stepsRemaining,
  maxSteps,
  weather,
  timer,
  onEndTurn,
  onFullscreenToggle,
  isFullscreen,
  className = ''
}) => {
  const [showOptions, setShowOptions] = useState(false)

  const getWeatherIcon = (weather: string) => {
    const weatherMap: Record<string, string> = {
      clear: '☀️',
      cloudy: '☁️',
      rain: '🌧️',
      storm: '⛈️',
      fog: '🌫️'
    }
    return weatherMap[weather.toLowerCase()] || '☀️'
  }

  return (
    <div className={`modern-hud ${className}`}>
      {/* Top Bar */}
      <motion.div
        className="top-bar"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Weather Info */}
        <motion.div
          className="weather-info"
          whileHover={{ scale: 1.05 }}
        >
          <span className="weather-icon">{getWeatherIcon(weather)}</span>
          <span className="weather-text">{weather}</span>
        </motion.div>

        {/* Timer */}
        <motion.div
          className="timer"
          animate={{ scale: timer < 10 ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.5, repeat: timer < 10 ? Infinity : 0 }}
        >
          <span className="timer-text">{timer.toFixed(1)}s</span>
        </motion.div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <motion.button
            className="action-btn help-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>?</span>
          </motion.button>

          <motion.button
            className="action-btn bugs-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🐛</span>
            <span className="bug-count">2</span>
          </motion.button>

          <motion.button
            className="action-btn maps-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🗺️</span>
          </motion.button>

          <motion.button
            className="action-btn fullscreen-btn"
            onClick={onFullscreenToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{isFullscreen ? '⤓' : '⤢'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Team Panels */}
      <motion.div
        className="team-panels"
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Player Team */}
        <motion.div
          className={`team-panel player-team ${currentTurn === 'player' ? 'active' : ''}`}
          animate={{
            boxShadow: currentTurn === 'player' 
              ? '0 0 20px rgba(0, 255, 136, 0.5)' 
              : '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="team-header">
            <div className="team-name">{playerTeam.name}</div>
            <div className="team-indicator">P</div>
          </div>
          
          <div className="health-section">
            <div className="health-label">Health</div>
            <div className="health-bar">
              <motion.div
                className="health-fill player-health"
                initial={{ width: 0 }}
                animate={{ width: `${(playerTeam.health / playerTeam.maxHealth) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="health-text">
              {playerTeam.health}/{playerTeam.maxHealth}
            </div>
          </div>

          <div className="units-section">
            <div className="units-grid">
              {Array.from({ length: playerTeam.maxUnits }, (_, i) => (
                <div
                  key={i}
                  className={`unit-slot ${i < playerTeam.units ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* CPU Team */}
        <motion.div
          className={`team-panel cpu-team ${currentTurn === 'cpu' ? 'active' : ''}`}
          animate={{
            boxShadow: currentTurn === 'cpu' 
              ? '0 0 20px rgba(255, 68, 68, 0.5)' 
              : '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="team-header">
            <div className="team-name">{cpuTeam.name}</div>
            <div className="team-indicator">C</div>
          </div>
          
          <div className="health-section">
            <div className="health-label">Health</div>
            <div className="health-bar">
              <motion.div
                className="health-fill cpu-health"
                initial={{ width: 0 }}
                animate={{ width: `${(cpuTeam.health / cpuTeam.maxHealth) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="health-text">
              {cpuTeam.health}/{cpuTeam.maxHealth}
            </div>
          </div>

          <div className="units-section">
            <div className="units-grid">
              {Array.from({ length: cpuTeam.maxUnits }, (_, i) => (
                <div
                  key={i}
                  className={`unit-slot ${i < cpuTeam.units ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Turn Indicator */}
      <motion.div
        className="turn-indicator"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="steps-remaining">
          <div className="steps-title">⚡ STEPS REMAINING ⚡</div>
          <div className="steps-bar">
            <motion.div
              className="steps-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(stepsRemaining / maxSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="steps-text">{stepsRemaining}/{maxSteps}</div>
        </div>

        <div className="turn-actions">
          <motion.button
            className="select-unit-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Select Unit</span>
            <small>Press T</small>
          </motion.button>

          <motion.button
            className="end-turn-btn"
            onClick={onEndTurn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>End Turn</span>
            <small>Pass to CPU</small>
          </motion.button>
        </div>
      </motion.div>

      {/* Options Menu */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            className="options-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOptions(false)}
          >
            <motion.div
              className="options-menu"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="menu-header">
                <h2>Options</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowOptions(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="menu-options">
                <motion.button
                  className="menu-option"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>[v]iew map</span>
                </motion.button>
                
                <motion.button
                  className="menu-option"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>q[u]it game</span>
                </motion.button>
                
                <motion.button
                  className="menu-option"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>[m]usic: ON</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .modern-hud {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1000;
          font-family: 'Inter', sans-serif;
        }

        .top-bar {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          pointer-events: auto;
        }

        .weather-info {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
        }

        .weather-icon {
          font-size: 20px;
        }

        .weather-text {
          font-size: 14px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .timer {
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .bugs-btn {
          background: linear-gradient(135deg, #f44336, #d32f2f);
        }

        .bug-count {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ff4444;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 700;
        }

        .team-panels {
          position: absolute;
          top: 100px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
          pointer-events: auto;
        }

        .team-panel {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(15px);
          border-radius: 16px;
          padding: 20px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          min-width: 200px;
          transition: all 0.3s ease;
        }

        .team-panel.active {
          border-color: rgba(0, 255, 136, 0.5);
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .team-name {
          color: white;
          font-size: 16px;
          font-weight: 600;
        }

        .team-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
        }

        .player-team .team-indicator {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
        }

        .cpu-team .team-indicator {
          background: linear-gradient(135deg, #ff4444, #cc3333);
        }

        .health-section {
          margin-bottom: 16px;
        }

        .health-label {
          color: #ccc;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .health-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .health-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .player-health {
          background: linear-gradient(90deg, #00ff88, #00cc6a);
        }

        .cpu-health {
          background: linear-gradient(90deg, #ff4444, #cc3333);
        }

        .health-text {
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .units-section {
          margin-top: 12px;
        }

        .units-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }

        .unit-slot {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .unit-slot.active {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          border-color: #00ff88;
        }

        .turn-indicator {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          pointer-events: auto;
        }

        .steps-remaining {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(15px);
          border-radius: 16px;
          padding: 16px 24px;
          border: 2px solid rgba(0, 255, 136, 0.3);
          text-align: center;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
        }

        .steps-title {
          color: #00ff88;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .steps-bar {
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .steps-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ff88, #00cc6a);
          border-radius: 6px;
          transition: width 0.3s ease;
        }

        .steps-text {
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .turn-actions {
          display: flex;
          gap: 12px;
        }

        .select-unit-btn,
        .end-turn-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 20px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .select-unit-btn {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
        }

        .end-turn-btn {
          background: linear-gradient(135deg, #f44336, #da190b);
          color: white;
        }

        .select-unit-btn small,
        .end-turn-btn small {
          font-size: 10px;
          opacity: 0.8;
          margin-top: 2px;
        }

        .options-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        }

        .options-menu {
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 32px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          min-width: 300px;
          max-width: 500px;
        }

        .menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .menu-header h2 {
          color: white;
          margin: 0;
          font-size: 24px;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .menu-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .menu-option {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px 20px;
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .menu-option:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
          .team-panels {
            flex-direction: column;
            gap: 12px;
          }
          
          .team-panel {
            min-width: auto;
          }
          
          .turn-actions {
            flex-direction: column;
            width: 100%;
          }
          
          .options-menu {
            margin: 20px;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  )
}

export default ModernHUD
