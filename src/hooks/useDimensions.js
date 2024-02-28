// taken from  chakra-ui's hooks - use-dimensions: https://github.com/chakra-ui/chakra-ui/blob/%40chakra-ui/react%402.2.9/packages/hooks/src/use-dimensions.ts
import { getBox } from 'css-box-model'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

function canUseDOM() {
  return !!(typeof window !== 'undefined' && window.document && window.document.createElement)
}

export const isBrowser = /* @__PURE__ */ canUseDOM()

export const useSafeLayoutEffect = isBrowser ? useLayoutEffect : useEffect

/**
 * React hook to measure a component's dimensions
 *
 * @param ref ref of the component to measure
 * @param observe if `true`, resize and scroll observers will be turned on
 *
 */
export function useDimensions(ref, observe) {
  const [dimensions, setDimensions] = useState(null)
  const rafId = useRef()

  useSafeLayoutEffect(() => {
    if (!ref.current) return undefined

    const node = ref.current

    function measure() {
      rafId.current = requestAnimationFrame(() => {
        const boxModel = getBox(node)
        setDimensions(boxModel)
      })
    }

    measure()

    if (observe) {
      window.addEventListener('resize', measure)
      window.addEventListener('scroll', measure)
    }

    return () => {
      if (observe) {
        window.removeEventListener('resize', measure)
        window.removeEventListener('scroll', measure)
      }

      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [observe])

  return dimensions
}
