import { useRef } from 'react'

import { useFixViewport } from '@/hooks/useFixViewPort'
import { cn } from '@/lib/utils'

export default function PreviewCanvas({ children }) {
  const parentRef = useRef(null)
  const childRef = useRef(null)

  useFixViewport(parentRef, childRef)
  return (
    <div className='h-full'>
      <div ref={parentRef}>
        <section
          ref={childRef}
          className='relative h-[576px]! w-[1024px]! bg-black/40 bg-[url("/images/content-studio/bg_1.png")] bg-contain bg-center bg-no-repeat'
        >
          {/* Background selector result */}
          <div className='flex items-center justify-center'>{children}</div>
        </section>
      </div>
      <div
        id='share-origin'
        className={cn(
          'fixed top-[100vh] left-[100vh] hidden h-[576px]! w-[1024px]!',
          "bg-black/40 bg-[url('/images/content-studio/bg_1.png')] bg-contain bg-center bg-no-repeat",
        )}
      >
        <div className='flex items-center justify-center'>{children}</div>
      </div>
    </div>
  )
}
