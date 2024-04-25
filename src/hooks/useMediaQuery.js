import { useEffect, useState } from 'react'

export const useMediaQuery = () => {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWidth(window.innerWidth)

      const handleResize = () => {
        setWidth(window?.innerWidth)
      }

      window?.addEventListener('resize', handleResize)

      return () => {
        window?.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  return {
    isMdDown: width < 768,
    isLgDown: width < 1024,
  }
}
