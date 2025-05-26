"use client"

import { JSX,useEffect, useRef, useState } from "react"

interface Dimensions {
  width: number
  height: number
}

interface ParticleType {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  update: (width: number, height: number) => void
  draw: (ctx: CanvasRenderingContext2D) => void
}

export function AnimatedBackground(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    class Particle implements ParticleType {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.size = Math.random() * 2 + 0.5
        this.speedX = Math.random() * 1 - 0.5
        this.speedY = Math.random() * 1 - 0.5
        this.color = `rgba(${Math.random() * 60 + 80}, ${Math.random() * 60 + 120}, 255, 0.4)`
      }
      
      update(width: number, height: number): void {
        this.x += this.speedX
        this.y += this.speedY
        
        if (this.x > width || this.x < 0) this.speedX *= -1
        if (this.y > height || this.y < 0) this.speedY *= -1
      }
      
      draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    const resizeCanvas = (): void => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      setDimensions({ width: rect.width, height: rect.height })
      init()
    }
    
    let particles: Particle[] = []
    const init = (): void => {
      particles = []
      const numberOfParticles = Math.min((canvas.width * canvas.height) / 12000, 80)
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle(
          Math.random() * canvas.width,
          Math.random() * canvas.height
        ))
      }
    }
    
    const connect = (): void => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 120) {
            const opacity = (1 - distance / 120) * 0.25
            const gradient = ctx.createLinearGradient(
              particles[i].x,
              particles[i].y,
              particles[j].x,
              particles[j].y
            )
            gradient.addColorStop(0, `rgba(59, 130, 246, ${opacity})`)
            gradient.addColorStop(1, `rgba(236, 72, 153, ${opacity})`)
            
            ctx.strokeStyle = gradient
            ctx.lineWidth = 0.
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }
    
    const animate = (): void => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.update(canvas.width, canvas.height)
        particle.draw(ctx)
      })
      
      connect()
      requestAnimationFrame(animate)
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    animate()
    
    return (): void => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-neutral-950">
      {/* Blue gradient - top right - more spread */}
      <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/25 via-blue-400/15 via-blue-300/8 to-transparent rounded-full blur-3xl" />
      
      {/* Pink gradient - bottom left - more spread */}
      <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-gradient-to-tr from-pink-500/25 via-pink-400/15 via-pink-300/8 to-transparent rounded-full blur-3xl" />
      
      {/* Additional subtle gradients for more coverage */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-bl from-blue-400/10 via-blue-300/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-pink-400/10 via-pink-300/5 to-transparent rounded-full blur-3xl" />
      
      {/* Center mixing gradient */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-purple-500/5 via-transparent to-transparent rounded-full blur-3xl" />
      
      {/* Particle network canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          background: 'transparent',
          mixBlendMode: 'normal'
        }}
      />
    </div>
  )
}