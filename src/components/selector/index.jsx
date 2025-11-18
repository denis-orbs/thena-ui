import React from 'react'

import cn from '@/utils/classes'

function Selector({ className, data, classNames }) {
  return (
    <div className={cn('rounded-xl border border-neutral-700 bg-transparent', className)}>
      {data.map((ele, idx) => (
        <div
          className={cn(
            'flex cursor-pointer items-center gap-4 border-b border-neutral-700 p-6 first:rounded-t-xl last:rounded-b-xl last:border-0',
            ele.active && 'bg-primary-950/50',
            classNames?.item ?? '',
          )}
          key={`selector-${idx}`}
          onClick={() => ele.onClickHandler()}
        >
          {ele.active ? (
            <div className='bg-primary-600 h-5 w-5 rounded-full p-1.5'>
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

export default Selector
