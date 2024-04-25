import { useEffect, useState } from 'react'

export const useMediaQuery = () => {
  const [width, setWidth] = useState(window ? window.innerWidth : 0)

  useEffect(() => {
    const handleResize = () => {
      setWidth(window?.innerWidth)
    }

    window?.addEventListener('resize', handleResize)

    return () => {
      window?.removeEventListener('resize', handleResize)
    }
  }, [])

  return {
    isMdDown: width < 768,
    isLgDown: width < 1024,
  }
}
