import React, { useEffect, useState } from 'react'

interface FloatingParticleProps {
  delay: number;
}

const FloatingParticle: React.FC<FloatingParticleProps> = ({ delay }) => (
  <div 
    className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
      animationDelay: `${delay}s`
    }}
  />
)

const AnimatedBackground: React.FC = () => {
  const [particles, setParticles] = useState<number[]>([])

  useEffect(() => {
    setParticles(Array.from({ length: 20 }, (_, i) => i))
  }, [])

  return (
    <div className="fixed inset-0 opacity-30 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
      {particles.map((i) => (
        <FloatingParticle key={i} delay={i * 0.1} />
      ))}
    </div>
  )
}

export default AnimatedBackground
