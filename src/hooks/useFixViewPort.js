'use client'

import { useEffect } from 'react'

export const useFixViewport = refs => {
  useEffect(() => {
    const fixViewport = () => {
      let zoom
      const ww =
        window.innerWidth > screen.width || document.body.clientWidth > screen.width
          ? screen.width
          : window.innerWidth || document.body.clientWidth

      const mw = 1400
      const ratio = ww / mw
      if (ww > 1400) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        zoom = '100%'
      } else if (ww >= 768) {
        zoom = `${Math.floor(ratio * 100 - 1)}%`
      } else {
        zoom = '50%'
      }

      if (refs) {
        refs.forEach(ref => {
          if (ref.current) {
            ref.current.style.setProperty('zoom', zoom)
          }
        })
      }
    }
    if (window) {
      fixViewport()
      window.addEventListener('resize', () => {
        fixViewport()
      })
    }
  }, [refs])
}
