import React, { useEffect, useMemo, useRef, useState } from 'react'

function RenderIfVisible({
  defaultHeight = 300,
  visibleOffset = 1000,
  root = null,
  rootElementClass = '',
  placeholderElementClass = '',
  children,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const placeholderHeight = useRef(defaultHeight)
  const intersectionRef = useRef(null)

  // Set visibility with intersection observer
  useEffect(() => {
    if (intersectionRef.current) {
      const localRef = intersectionRef.current
      const observer = new IntersectionObserver(
        entries => {
          // Before switching off `isVisible`, set the height of the placeholder
          if (!entries[0].isIntersecting) {
            placeholderHeight.current = localRef?.offsetHeight
          }
          if (typeof window !== 'undefined' && window.requestIdleCallback) {
            window.requestIdleCallback(() => setIsVisible(entries[0].isIntersecting), {
              timeout: 100,
            })
          } else {
            setIsVisible(entries[0].isIntersecting)
          }
        },
        { root, rootMargin: `${visibleOffset}px 0px ${visibleOffset}px 0px` },
      )

      observer.observe(localRef)
      return () => {
        if (localRef) {
          observer.unobserve(localRef)
        }
      }
    }
    return () => {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const placeholderStyle = { height: placeholderHeight.current }
  const rootClasses = useMemo(() => `renderIfVisible ${rootElementClass}`, [rootElementClass])
  const placeholderClasses = useMemo(
    () => `renderIfVisible-placeholder ${placeholderElementClass}`,
    [placeholderElementClass],
  )

  return (
    <div ref={intersectionRef} className={rootClasses}>
      {isVisible ? <>{children}</> : <div style={placeholderStyle} className={placeholderClasses} />}
    </div>
  )
}

export default RenderIfVisible
