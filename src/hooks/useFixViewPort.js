'use client'

import { useEffect } from 'react'

const useFixViewport = (parentRef, childRef, resize) => {
  useEffect(() => {
    const fixViewport = () => {
      if (parentRef && childRef) {
        let zoom
        const info = parentRef?.current?.getBoundingClientRect()
        if (info) {
          const ww = info?.width
          const mw = 1024
          const ratio = ww / mw
          if (ww >= 1024) {
            zoom = '100%'
          } else {
            zoom = `${Math.floor(ratio * 100)}%`
          }

          if (childRef?.current) {
            childRef?.current?.style?.setProperty('transform', `scale(${zoom})`)
            const childInfo = childRef?.current?.getBoundingClientRect()
            parentRef?.current?.style?.setProperty('height', `${childInfo?.height}px`)
          }
        }
      }
    }
    if (window) {
      fixViewport()
      window.addEventListener('resize', () => {
        fixViewport()
      })
    }
  }, [childRef, parentRef, resize])
}
export { useFixViewport }
