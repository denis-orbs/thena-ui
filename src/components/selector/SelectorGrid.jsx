import React from 'react'

import { cn } from '@/lib/utils'

function SelectorGrid({ data, classNames, isGrid = true }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 xl:grid-cols-2', !isGrid && 'xl:grid-cols-1')}>
      {data.map((ele, idx) => (
        <div
          className={cn(
            'flex cursor-pointer items-center gap-4 rounded-xl border-neutral-700 p-6 hover:bg-neutral-800',
            ele.active ? 'bg-primary-950/60 hover:bg-primary-950/60' : classNames?.item ?? 'bg-neutral-900',
          )}
          key={`selector-${idx}`}
          onClick={() => ele.onClickHandler()}
        >
          {ele.active ? (
            <div className='size-5 rounded-full bg-primary-600 p-1.5'>
              <div className='h-2 w-2 rounded-full bg-white' />
            </div>
          ) : (
            <div className='size-5 rounded-full border border-neutral-600' />
          )}
          {ele.content}
        </div>
      ))}
    </div>
  )
}

export default SelectorGrid
