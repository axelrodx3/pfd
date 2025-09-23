import React, { useRef, useEffect } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
}

interface ParticleEffectsProps {
  effects: Array<{
    id: string
    type: 'explosion' | 'smoke' | 'spark' | 'trail'
    x: number
    y: number
    color?: string
    intensity?: number
  }>
  onEffectComplete: (effectId: string) => void
}

export const ParticleEffects: React.FC<ParticleEffectsProps> = ({
  effects,
  onEffectComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Create particles for new effects
    effects.forEach(effect => {
      if (!particlesRef.current.some(p => p.x === effect.x && p.y === effect.y && p.life > p.maxLife * 0.8)) {
        createParticles(effect)
      }
    })

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        updateParticle(particle)
        drawParticle(ctx, particle)
        return particle.life > 0
      })

      // Check for completed effects
      const activeEffects = effects.filter(effect => 
        particlesRef.current.some(p => 
          Math.abs(p.x - effect.x) < 50 && 
          Math.abs(p.y - effect.y) < 50 && 
          p.life > 0
        )
      )

      effects.forEach(effect => {
        if (!activeEffects.includes(effect)) {
          onEffectComplete(effect.id)
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [effects, onEffectComplete])

  const createParticles = (effect: any) => {
    const particleCount = effect.intensity || 20
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
      const speed = (Math.random() * 3 + 1) * (effect.intensity || 1)
      
      let particle: Particle
      
      switch (effect.type) {
        case 'explosion':
          particle = {
            x: effect.x,
            y: effect.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 60 + Math.random() * 40,
            maxLife: 100,
            size: 2 + Math.random() * 4,
            color: effect.color || '#ff4444',
            alpha: 1
          }
          break
          
        case 'smoke':
          particle = {
            x: effect.x + (Math.random() - 0.5) * 20,
            y: effect.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            life: 80 + Math.random() * 60,
            maxLife: 140,
            size: 3 + Math.random() * 6,
            color: '#888888',
            alpha: 0.7
          }
          break
          
        case 'spark':
          particle = {
            x: effect.x,
            y: effect.y,
            vx: Math.cos(angle) * speed * 2,
            vy: Math.sin(angle) * speed * 2,
            life: 20 + Math.random() * 20,
            maxLife: 40,
            size: 1 + Math.random() * 2,
            color: effect.color || '#ffff00',
            alpha: 1
          }
          break
          
        case 'trail':
          particle = {
            x: effect.x + (Math.random() - 0.5) * 10,
            y: effect.y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 2 - 0.5,
            life: 30 + Math.random() * 30,
            maxLife: 60,
            size: 1 + Math.random() * 3,
            color: effect.color || '#ffaa00',
            alpha: 0.8
          }
          break
          
        default:
          particle = {
            x: effect.x,
            y: effect.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 30,
            maxLife: 30,
            size: 2,
            color: '#ffffff',
            alpha: 1
          }
      }
      
      particlesRef.current.push(particle)
    }
  }

  const updateParticle = (particle: Particle) => {
    particle.x += particle.vx
    particle.y += particle.vy
    particle.life--
    
    // Apply gravity for some particle types
    if (particle.color === '#ff4444' || particle.color === '#ffff00') {
      particle.vy += 0.1
    }
    
    // Fade out
    particle.alpha = particle.life / particle.maxLife
    
    // Slow down over time
    particle.vx *= 0.98
    particle.vy *= 0.98
  }

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save()
    ctx.globalAlpha = particle.alpha
    
    // Create gradient for explosion particles
    if (particle.color === '#ff4444') {
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      )
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(0.5, '#ffaa00')
      gradient.addColorStop(1, '#ff4444')
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = particle.color
    }
    
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999
      }}
    />
  )
}

export default ParticleEffects
