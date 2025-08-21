import React from 'react'

import { cn } from '@/lib/utils'

function SelectorGrid({ data, classNames, className, canSelect = true, isGrid = true }) {
  return (
    <div className={cn('grid grid-cols-1 gap-2 xl:grid-cols-2', !isGrid && 'xl:grid-cols-1', className)}>
      {data.map((ele, idx) => (
        <div
          className={cn(
            'flex h-[68px] items-center justify-center gap-2 rounded-xl border-neutral-700 p-2 hover:bg-neutral-800 md:p-4',
            canSelect ? 'cursor-pointer' : 'cursor-default',
            classNames?.item,
            ele.active && 'bg-primary-950/60 hover:bg-primary-950/60',
          )}
          key={`selector-${idx}`}
          onClick={() => canSelect && ele.onClickHandler()}
        >
          {canSelect &&
            (ele.active ? (
              <div className='bg-primary-600 size-5 rounded-full p-1.5'>
                <div className='h-2 w-2 rounded-full bg-white' />
              </div>
            ) : (
              <div className='size-5 rounded-full border border-neutral-600' />
            ))}
          {ele.content}
        </div>
      ))}
    </div>
  )
}

export default SelectorGrid
