import { useEffect, useRef, useState } from 'react'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { LogoIcon, ThenaFiLinkIcon } from '@/svgs'

export default function PreviewCanvas({ children, background, className }) {
  const parentRef = useRef(null)
  const childRef = useRef(null)
  const [scale, setScale] = useState(1)
  const { isLgDown } = useMediaQuery()

  // useFixViewport(parentRef, childRef)
  useEffect(() => {
    const calculateScale = () => {
      if (parentRef.current) {
        const parentRect = parentRef.current.getBoundingClientRect()
        const availableWidth = parentRect.width
        const availableHeight = parentRect.height

        const baseWidth = 1024
        const baseHeight = 576

        const scaleX = availableWidth / baseWidth
        const scaleY = availableHeight / baseHeight

        const newScale = Math.min(scaleX, scaleY, 1)
        setScale(newScale)
      }
    }

    calculateScale()
    window.addEventListener('resize', calculateScale)

    return () => window.removeEventListener('resize', calculateScale)
  }, [])
  return (
    <>
      <div
        className={cn('overflow-hidden', className)}
        style={{
          ...(isLgDown ? { height: `${576 * scale}px` } : { height: '576px' }),
        }}
        ref={parentRef}
      >
        <section
          ref={childRef}
          className='relative origin-center rounded-xl border border-neutral-700 bg-contain bg-center bg-no-repeat'
          style={{
            width: '1024px',
            minWidth: '1024px',
            minHeight: '576px',
            maxWidth: '1024px',
            maxHeight: '576px',
            transform: `scale(${scale})`,
            backgroundImage: `url(${background.image})`,
            transformOrigin: 'top left',
          }}
        >
          <div className='flex h-full items-center justify-center'>{children}</div>
        </section>
      </div>
      <div
        id='share-origin'
        className={cn(
          'fixed top-[100vh] left-[100vh] hidden',
          'order-3 origin-top-left bg-contain bg-center bg-no-repeat',
        )}
        style={{
          aspectRatio: '1024/576',
          minWidth: '1024px',
          minHeight: '576px',
          maxWidth: '1024px',
          maxHeight: '576px',
          backgroundImage: `url(${background.value})`,
        }}
      >
        <div className='flex items-center justify-center'>{children}</div>
        <div className='absolute bottom-0 left-0 flex w-full items-center justify-between px-10 py-9'>
          <LogoIcon className='h-8 w-auto' />
          <ThenaFiLinkIcon className='h-4 w-auto' />
        </div>
      </div>
    </>
  )
}
