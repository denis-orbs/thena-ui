import React from 'react'

import { cn } from '@/lib/utils'

function SelectorGrid({ data, classNames, isGrid = true, className }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-2', !isGrid && 'lg:grid-cols-1', className)}>
      {data.map((ele, idx) => (
        <div
          className={cn(
            'flex cursor-pointer items-center gap-4 rounded-xl border-neutral-700 bg-neutral-700 p-6',
            ele.active && 'bg-primary-950 bg-opacity-50',
            classNames?.item ?? '',
          )}
          key={`selector-${idx}`}
          onClick={() => ele.onClickHandler()}
        >
          {ele.active ? (
            <div className='h-5 w-5 rounded-full bg-primary-600 p-1.5'>
              <div className='h-2 w-2 rounded-full bg-white' />
            </div>
          ) : (
            <div className='h-5 w-5 rounded-full border border-neutral-600' />
          )}
          {ele.content}
        </div>
      ))}
    </div>
  )
}

export default SelectorGrid
