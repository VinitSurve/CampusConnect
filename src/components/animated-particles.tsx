'use client';

import { useState, useEffect } from 'react';

interface Particle {
  id: number;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

export default function AnimatedParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generatedParticles = Array(20)
      .fill(0)
      .map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${5 + Math.random() * 10}s`,
      }));
    setParticles(generatedParticles);
  }, []);

  if (particles.length === 0) {
    return null; // Don't render anything on the server
  }

  return (
    <div className="particles absolute inset-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 bg-white rounded-full opacity-30 animate-float"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
          }}
        ></div>
      ))}
    </div>
  );
}