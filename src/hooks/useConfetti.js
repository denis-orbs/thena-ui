import confetti from 'canvas-confetti'
import { useRef } from 'react'

const count = 200
const defaults = {
  origin: { y: 0.7 },
}

export function useConfetti(particleRatio, opts) {
  const ref = useRef()

  return [
    ref,
    () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: no-preference)')
      if (mediaQuery?.matches) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        })
      }
    },
  ]
}
