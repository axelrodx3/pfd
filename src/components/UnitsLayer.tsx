import React, { useMemo } from 'react'

export type Unit = {
  id: string
  team: 'player' | 'cpu'
  x: number
  y: number
  facing?: 'left' | 'right'
}

export interface UnitsLayerProps {
  units: Unit[]
  width: number
  height: number
  playerColor?: string
  cpuColor?: string
  showDebug?: boolean
  onUnitClick?: (id: string) => void
  highlightUnitId?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function StickFigure({
  x,
  y,
  color,
  facing = 'right',
  showDebug,
}: {
  x: number
  y: number
  color: string
  facing?: 'left' | 'right'
  showDebug?: boolean
}) {
  // Simple stick figure proportions
  const headRadius = 8
  const bodyLength = 22
  const limbLength = 14
  const dir = facing === 'right' ? 1 : -1

  const headCx = x
  const headCy = y - bodyLength - headRadius
  const neckX = x
  const neckY = y - bodyLength
  const hipX = x
  const hipY = y

  const armDX = limbLength * 0.9 * dir
  const legDX = limbLength * 0.6 * dir

  return (
    <g>
      {/* Shadow for 3D depth */}
      <g opacity={0.25}>
        <circle cx={headCx + 3} cy={headCy + 3} r={headRadius} fill="#000" />
        <line x1={neckX + 3} y1={neckY + 3} x2={hipX + 3} y2={hipY + 3} stroke="#000" strokeWidth={4} strokeLinecap="round" />
        <line x1={neckX + 3} y1={neckY + 7} x2={neckX + armDX + 3} y2={neckY + 13} stroke="#000" strokeWidth={4} strokeLinecap="round" />
        <line x1={neckX + 3} y1={neckY + 7} x2={neckX - armDX + 3} y2={neckY + 13} stroke="#000" strokeWidth={4} strokeLinecap="round" />
        <line x1={hipX + 3} y1={hipY + 3} x2={hipX + legDX + 3} y2={hipY + limbLength + 3} stroke="#000" strokeWidth={4} strokeLinecap="round" />
        <line x1={hipX + 3} y1={hipY + 3} x2={hipX - legDX + 3} y2={hipY + limbLength + 3} stroke="#000" strokeWidth={4} strokeLinecap="round" />
      </g>
      {/* Head */}
      <circle cx={headCx} cy={headCy} r={headRadius} fill="#000" stroke="#000" strokeWidth={2} />
      {/* Body */}
      <line x1={neckX} y1={neckY} x2={hipX} y2={hipY} stroke="#000" strokeWidth={3} strokeLinecap="round" />
      {/* Arms */}
      <line x1={neckX} y1={neckY + 4} x2={neckX + armDX} y2={neckY + 10} stroke="#000" strokeWidth={3} strokeLinecap="round" />
      <line x1={neckX} y1={neckY + 4} x2={neckX - armDX} y2={neckY + 10} stroke="#000" strokeWidth={3} strokeLinecap="round" />
      {/* Legs */}
      <line x1={hipX} y1={hipY} x2={hipX + legDX} y2={hipY + limbLength} stroke="#000" strokeWidth={3} strokeLinecap="round" />
      <line x1={hipX} y1={hipY} x2={hipX - legDX} y2={hipY + limbLength} stroke="#000" strokeWidth={3} strokeLinecap="round" />

      {showDebug && (
        <g>
          <circle cx={x} cy={y} r={2} fill="#fff" />
          <text x={x + 6} y={y - 6} fontSize={10} fill="#ddd">{`${Math.round(x)},${Math.round(y)}`}</text>
        </g>
      )}
    </g>
  )
}

export const UnitsLayer: React.FC<UnitsLayerProps> = ({
  units,
  width,
  height,
  playerColor = '#00ff88',
  cpuColor = '#ff4444',
  showDebug = false,
  onUnitClick,
  highlightUnitId,
}) => {
  const safeUnits = useMemo(() => {
    const ground = height * 0.9
    return units.map(u => ({
      ...u,
      x: clamp(u.x, 16, Math.max(32, width - 16)),
      y: clamp(u.y, 32, Math.max(64, ground)),
    }))
  }, [units, width, height])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }}
      aria-label="UnitsLayer"
    >
      {showDebug && (
        <g>
          <rect x={2} y={2} width={Math.max(0, width - 4)} height={Math.max(0, height - 4)} fill="none" stroke="#00e5ff" strokeWidth={2} strokeDasharray="6 4" />
          <text x={12} y={24} fontSize={14} fill="#00e5ff">UnitsLayer {width}x{height}</text>
        </g>
      )}

      {safeUnits.length === 0 && showDebug && (
        <text x={width / 2} y={height / 2} fontSize={16} fill="#ffeb3b" textAnchor="middle">No units</text>
      )}

      {safeUnits.map(u => (
        <g key={u.id} onClick={onUnitClick ? () => onUnitClick(u.id) : undefined} style={{ pointerEvents: onUnitClick ? 'auto' : 'none' }}>
          {/* Highlight ring for controlled unit */}
          {highlightUnitId === u.id && (
            <g>
              <circle cx={u.x} cy={u.y - 30} r={16} fill="none" stroke="#ffd54f" strokeWidth={4} />
              <circle cx={u.x} cy={u.y - 30} r={22} fill="none" stroke="#ffb300" strokeOpacity={0.6} strokeWidth={2} />
            </g>
          )}
          <StickFigure
            x={u.x}
            y={u.y}
            color={u.team === 'player' ? playerColor : cpuColor}
            facing={u.facing}
            showDebug={showDebug}
          />
        </g>
      ))}
    </svg>
  )
}

export default UnitsLayer


