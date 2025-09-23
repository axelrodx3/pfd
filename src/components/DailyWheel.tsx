import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

export interface WheelSegment {
  label: string
  value: number
  color: string
}

export interface DailyWheelHandle {
  spinToIndex: (index: number) => void
}

interface DailyWheelProps {
  segments: WheelSegment[]
  size?: number
  onSpinEnd?: (landedIndex: number) => void
  volume?: number
}

/**
 * SVG-based daily wheel. Wedges (with gradients) are drawn first, then crisp
 * black divider lines are drawn on a top layer to ensure they remain visible.
 */
export const DailyWheel = React.forwardRef<DailyWheelHandle, DailyWheelProps>(
  ({ segments, size = 280, onSpinEnd, volume = 0.5 }, ref) => {
    const wheelRef = useRef<HTMLDivElement>(null)
    const [rotation, setRotation] = useState(0)
    const [isSpinning, setIsSpinning] = useState(false)
    const spinAudioRef = useRef<HTMLAudioElement | null>(null)
    const winAudioRef = useRef<HTMLAudioElement | null>(null)

    const sliceAngle = 360 / Math.max(1, segments.length)
    const startAngleDeg = 0.0001 // tiny offset to avoid seam overlap

    useImperativeHandle(ref, () => ({
      spinToIndex: (index: number) => {
        if (isSpinning) return
        const fullSpins = 5 + Math.floor(Math.random() * 3)

        // Center of the target slice measured from 0deg pointing right
        const segmentCenter = index * sliceAngle + sliceAngle / 2
        // Pointer is visually at -90deg (top).
        const desired = ((-90 - segmentCenter) % 360 + 360) % 360
        const currentMod = ((rotation % 360) + 360) % 360
        let delta = desired - currentMod
        if (delta < 0) delta += 360

        // Prepare and start spin sound
        try {
          if (spinAudioRef.current) {
            spinAudioRef.current.pause()
            spinAudioRef.current.currentTime = 0
            spinAudioRef.current.volume = Math.max(0, Math.min(1, volume))
            spinAudioRef.current.loop = true
            void spinAudioRef.current.play()
          }
        } catch {}

        setIsSpinning(true)
        setRotation(prev => prev + fullSpins * 360 + delta)
      },
    }))

    useEffect(() => {
      if (!isSpinning) return
      const handle = async () => {
        setIsSpinning(false)
        if (onSpinEnd) {
          const normalized = ((rotation % 360) + 360) % 360
          const pointerAngle = (450 - normalized) % 360
          const index = Math.floor((pointerAngle % 360) / sliceAngle)
          onSpinEnd(index)
        }
        // Fade and stop spin sound, then play win sound exactly at land
        try {
          await fadeOut(spinAudioRef.current, 200)
          if (winAudioRef.current) {
            winAudioRef.current.currentTime = 0
            winAudioRef.current.volume = Math.max(0, Math.min(1, volume))
            void winAudioRef.current.play()
          }
        } catch {}
      }
      const t = setTimeout(() => { void handle() }, 3500)
      return () => clearTimeout(t)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSpinning])

    const gradientIds = useMemo(
      () => segments.map(() => `segGrad-${Math.random().toString(36).slice(2)}`),
      [segments.length]
    )

    // Initialize audio elements
    useEffect(() => {
      spinAudioRef.current = new Audio('/assets/sounds/spin.mp3')
      winAudioRef.current = new Audio('/assets/sounds/win.mp3')
      if (spinAudioRef.current) {
        spinAudioRef.current.volume = Math.max(0, Math.min(1, volume))
        spinAudioRef.current.loop = true
      }
      if (winAudioRef.current) {
        winAudioRef.current.volume = Math.max(0, Math.min(1, volume))
      }
      return () => {
        try {
          spinAudioRef.current?.pause()
          winAudioRef.current?.pause()
        } catch {}
      }
    }, [volume])

    // Helper: fade out an audio element before pausing to avoid overlap
    function fadeOut(audio: HTMLAudioElement | null, durationMs = 200) {
      return new Promise<void>(resolve => {
        if (!audio) return resolve()
        const startVol = audio.volume
        if (startVol <= 0) {
          audio.pause()
          audio.currentTime = 0
          audio.volume = Math.max(0, Math.min(1, volume))
          return resolve()
        }
        const steps = 8
        const stepTime = Math.max(10, Math.floor(durationMs / steps))
        let count = 0
        const id = window.setInterval(() => {
          count += 1
          const next = Math.max(0, startVol * (1 - count / steps))
          audio.volume = next
          if (count >= steps) {
            window.clearInterval(id)
            audio.pause()
            audio.currentTime = 0
            audio.volume = Math.max(0, Math.min(1, volume))
            resolve()
          }
        }, stepTime)
      })
    }

    function lighten(hex: string, amount = 0.18) {
      try {
        const num = parseInt(hex.replace('#', ''), 16)
        const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(255 * amount)))
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * amount)))
        const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * amount)))
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
      } catch {
        return hex
      }
    }

    function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
      const angleRad = (angleDeg * Math.PI) / 180
      return {
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad),
      }
    }

    function describeWedge(cx: number, cy: number, r: number, a0: number, a1: number) {
      const start = polarToCartesian(cx, cy, r, a0)
      const end = polarToCartesian(cx, cy, r, a1)
      const largeArc = a1 - a0 <= 180 ? 0 : 1
      return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
    }

    const center = size / 2
    const radius = center - 6

    return (
      <div className="relative" style={{ perspective: 1000 }}>
        {/* Pointer */}
        <div className="absolute left-1/2 -top-4 -translate-x-1/2 z-20">
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-[14px] border-l-transparent border-r-transparent border-b-hilo-gold drop-shadow-[0_2px_6px_rgba(255,215,0,.45)]" />
          <div className="w-1 h-3 bg-hilo-gold mx-auto" />
        </div>

        {/* Shadow */}
        <div
          className="absolute inset-0 -bottom-6 blur-2xl opacity-60"
          style={{
            transform: 'translateZ(0)',
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 60%)',
          }}
        />

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative rounded-full border border-white/10 shadow-2xl overflow-visible bg-[#101217] z-10"
          style={{
            width: size,
            height: size,
            transformStyle: 'preserve-3d',
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 3.5s cubic-bezier(.13,.77,.25,1.01)' : 'none',
          }}
        >
          <svg
            className="absolute inset-0"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            <defs>
              {segments.map((s, i) => (
                <radialGradient id={gradientIds[i]} key={`g-${i}`} cx="50%" cy="50%" r="75%">
                  <stop offset="0%" stopColor={lighten(s.color, 0.3)} />
                  <stop offset="65%" stopColor={s.color} />
                  <stop offset="100%" stopColor={s.color} />
                </radialGradient>
              ))}
            </defs>

            {/* 1) Draw all slices first with gradients */}
            <g>
              {segments.map((s, i) => {
                const a0 = startAngleDeg + i * sliceAngle
                const a1 = startAngleDeg + (i + 1) * sliceAngle
                const d = describeWedge(center, center, radius, a0, a1)
                return <path key={`wedge-${i}`} d={d} fill={`url(#${gradientIds[i]})`} />
              })}
            </g>

            {/* 2) Labels above wedges but below dividers */}
            <g>
              {segments.map((s, i) => {
                const angle = startAngleDeg + i * sliceAngle + sliceAngle / 2
                const pos = polarToCartesian(center, center, radius * 0.6, angle)
                return (
                  <text
                    key={`label-${i}`}
                    x={pos.x}
                    y={pos.y}
                    fontSize={Math.max(12, Math.round(size * 0.05))}
                    fontWeight={600}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    style={{ paintOrder: 'stroke' }}
                  >
                    {s.label}
                  </text>
                )
              })}
            </g>

            {/* 3) Divider lines on a separate top layer */}
            <g style={{ mixBlendMode: 'normal' }}>
              {Array.from({ length: segments.length }).map((_, i) => {
                const a = startAngleDeg + i * sliceAngle
                const end = polarToCartesian(center, center, radius, a)
                return (
                  <line
                    key={`divider-${i}`}
                    x1={center}
                    y1={center}
                    x2={end.x}
                    y2={end.y}
                    stroke="#000000"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    shapeRendering="geometricPrecision"
                    strokeLinecap="butt"
                  />
                )
              })}
            </g>

            {/* Outer rim on top */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(212,177,50,0.4)"
              strokeWidth={4}
              pointerEvents="none"
            />
          </svg>

          {/* Gloss overlay kept outside the svg for visual depth */}
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.25), rgba(255,255,255,0) 45%)',
              mixBlendMode: 'screen',
            }}
          />
        </div>
      </div>
    )
  }
)

DailyWheel.displayName = 'DailyWheel'

export default DailyWheel

