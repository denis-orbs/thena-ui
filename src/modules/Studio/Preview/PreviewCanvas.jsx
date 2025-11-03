import Image from 'next/image'
import { useRef } from 'react'

import { useFixViewport } from '@/hooks/useFixViewPort'
import { cn } from '@/lib/utils'

import LogoIcon from '~/logo.svg'

export default function PreviewCanvas({ children, background }) {
  const parentRef = useRef(null)
  const childRef = useRef(null)

  useFixViewport(parentRef, childRef)
  return (
    <>
      <div ref={parentRef}>
        <section
          ref={childRef}
          className='relative h-[576px]! w-[1024px]! origin-top-left rounded-xl border border-neutral-700 bg-contain bg-center bg-no-repeat'
          style={{
            aspectRatio: '1024/576',
            minWidth: '1024px',
            minHeight: '576px',
            maxWidth: '1024px',
            maxHeight: '576px',
            backgroundImage: `url(${background.image})`,
          }}
        >
          {/* Background selector result */}
          <div className='flex items-center justify-center'>{children}</div>
        </section>
      </div>
      <div
        id='share-origin'
        className={cn(
          'fixed top-[100vh] left-[100vh] hidden h-[1152px]! w-[2048px]!',
          'origin-top-left bg-contain bg-center bg-no-repeat',
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
          <Image src='/svgs/thena-fi-link.svg' className='h-4 w-auto' />
        </div>
      </div>
    </>
  )
}
