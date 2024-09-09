'use client'

import { useEffect, useRef } from 'react'

const useFixViewport = (parentRef, childRef) => {
  useEffect(() => {
    const fixViewport = () => {
      let zoom
      const info = parentRef.current.getBoundingClientRect()
      const ww = info.width
      const mw = 1024
      const ratio = ww / mw
      console.log('fixViewport', { ww, mw, ratio })
      if (ww >= 1024) {
        zoom = '100%'
      } else {
        zoom = `${Math.floor(ratio * 100)}%`
      }

      if (childRef.current) {
        childRef.current.style.setProperty('zoom', zoom)
      }
    }
    if (window) {
      fixViewport()
      window.addEventListener('resize', () => {
        fixViewport()
      })
    }
  }, [childRef, parentRef])
}

const useAspectRatio = (width = 1024, height = 576) => {
  const ref = useRef(null)
  const aspectRatio = width / height

  useEffect(() => {
    function updateSize() {
      if (ref.current) {
        ref.current.style.height = `${ref.current.clientWidth / aspectRatio}px`
      }
    }

    updateSize()

    window.addEventListener('resize', updateSize)

    return () => window.removeEventListener('resize', updateSize)
  }, [aspectRatio, ref])

  return ref
}

export { useAspectRatio, useFixViewport }
