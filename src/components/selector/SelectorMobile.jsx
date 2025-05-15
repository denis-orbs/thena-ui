import React from 'react'

import { cn } from '@/lib/utils'

export function SelectorPoolTypeMini({ data, className }) {
  return (
    <div className={cn('space-y-4', className)}>
      {data.map((ele, idx) => (
        <div key={`selector-${idx}`} onClick={() => ele.onClickHandler()}>
          {ele.content}
        </div>
      ))}
    </div>
  )
}

export function SelectorPoolTypeLarge({ data, className }) {
  return (
    <div className={cn('grid grid-cols-1', className)}>
      {data.map((ele, idx) => (
        <div
          className={cn(
            'flex items-center gap-4 rounded-xl border-neutral-700 p-6 hover:bg-neutral-800',
            ele.active ? 'bg-primary-950/60 hover:bg-primary-950/60' : 'bg-transparent',
          )}
          key={`selector-${idx}`}
          onClick={() => ele.onClickHandler()}
        >
          <>
            {ele.active ? (
              <div className='size-5 rounded-full bg-primary-600 p-1.5'>
                <div className='h-2 w-2 rounded-full bg-white' />
              </div>
            ) : (
              <div className='size-5 rounded-full border border-neutral-600' />
            )}
            {ele.content}
          </>
        </div>
      ))}
    </div>
  )
}
