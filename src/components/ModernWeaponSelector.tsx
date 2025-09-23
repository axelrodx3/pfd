import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Weapon {
  id: string
  name: string
  icon: string
  count: number
  color: string
  description: string
}

interface ModernWeaponSelectorProps {
  weapons: Weapon[]
  selectedWeapon: string | null
  onWeaponSelect: (weaponId: string) => void
  onWeaponUse: (weaponId: string) => void
  isVisible: boolean
  className?: string
}

export const ModernWeaponSelector: React.FC<ModernWeaponSelectorProps> = ({
  weapons,
  selectedWeapon,
  onWeaponSelect,
  onWeaponUse,
  isVisible,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredWeapon, setHoveredWeapon] = useState<string | null>(null)

  const handleWeaponClick = (weaponId: string) => {
    if (selectedWeapon === weaponId) {
      onWeaponUse(weaponId)
    } else {
      onWeaponSelect(weaponId)
    }
  }

  const getWeaponIcon = (icon: string) => {
    const iconMap: Record<string, string> = {
      grenade: '💣',
      gun: '🔫',
      bazooka: '🚀',
      boot: '👢',
      sniper: '🎯',
      medic: '💊',
      shield: '🛡️',
      knife: '🔪'
    }
    return iconMap[icon] || '❓'
  }

  if (!isVisible) return null

  return (
    <div className={`modern-weapon-selector ${className}`}>
      {/* Main weapon selector */}
      <motion.div
        className="weapon-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {weapons.map((weapon, index) => (
          <motion.div
            key={weapon.id}
            className={`weapon-card ${selectedWeapon === weapon.id ? 'selected' : ''} ${weapon.count === 0 ? 'disabled' : ''}`}
            onClick={() => weapon.count > 0 && handleWeaponClick(weapon.id)}
            onHoverStart={() => setHoveredWeapon(weapon.id)}
            onHoverEnd={() => setHoveredWeapon(null)}
            whileHover={weapon.count > 0 ? { scale: 1.05, y: -5 } : {}}
            whileTap={weapon.count > 0 ? { scale: 0.95 } : {}}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {/* Weapon icon */}
            <div className="weapon-icon" style={{ backgroundColor: weapon.color }}>
              <span className="icon-emoji">{getWeaponIcon(weapon.icon)}</span>
            </div>

            {/* Weapon info */}
            <div className="weapon-info">
              <div className="weapon-name">{weapon.name}</div>
              <div className="weapon-count">{weapon.count}</div>
            </div>

            {/* Selection indicator */}
            {selectedWeapon === weapon.id && (
              <motion.div
                className="selection-indicator"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              />
            )}

            {/* Hover tooltip */}
            <AnimatePresence>
              {hoveredWeapon === weapon.id && (
                <motion.div
                  className="weapon-tooltip"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="tooltip-title">{weapon.name}</div>
                  <div className="tooltip-description">{weapon.description}</div>
                  <div className="tooltip-count">Available: {weapon.count}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="action-buttons"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <motion.button
          className="action-btn move-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="btn-icon">🚶</span>
          <span className="btn-text">Move</span>
        </motion.button>

        <motion.button
          className="action-btn stay-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="btn-icon">⏸️</span>
          <span className="btn-text">Stay</span>
        </motion.button>
      </motion.div>

      <style jsx>{`
        .modern-weapon-selector {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .weapon-grid {
          display: flex;
          gap: 12px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 16px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .weapon-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 80px;
        }

        .weapon-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .weapon-card.selected {
          border-color: #00ff88;
          background: rgba(0, 255, 136, 0.1);
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }

        .weapon-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .weapon-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          background: linear-gradient(135deg, var(--weapon-color, #666), var(--weapon-color-dark, #444));
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .icon-emoji {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .weapon-info {
          text-align: center;
        }

        .weapon-name {
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .weapon-count {
          font-size: 10px;
          color: #00ff88;
          font-weight: 700;
        }

        .selection-indicator {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background: #00ff88;
          border-radius: 50%;
          border: 2px solid #000;
        }

        .weapon-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          white-space: nowrap;
          margin-bottom: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .weapon-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.9);
        }

        .tooltip-title {
          font-weight: 600;
          color: #00ff88;
        }

        .tooltip-description {
          font-size: 10px;
          color: #ccc;
          margin: 2px 0;
        }

        .tooltip-count {
          font-size: 10px;
          color: #ffaa00;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .move-btn {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
        }

        .stay-btn {
          background: linear-gradient(135deg, #f44336, #da190b);
          color: white;
        }

        .btn-icon {
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .weapon-grid {
            gap: 8px;
            padding: 12px;
          }
          
          .weapon-card {
            min-width: 60px;
            padding: 8px;
          }
          
          .weapon-icon {
            width: 36px;
            height: 36px;
          }
          
          .icon-emoji {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  )
}

export default ModernWeaponSelector
