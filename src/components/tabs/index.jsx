import React from 'react'

import { SizeTypes } from '@/constant/type'
import { cn } from '@/lib/utils'

function TabItem({ className, item, size }) {
  return (
    <button
      type='button'
      className={cn(
        'cursor-pointer rounded-lg px-4 py-2.5',
        'rounded px-3 py-2 text-xs',
        size === SizeTypes.Medium && 'lg:rounded-lg lg:px-4 lg:py-2.5 lg:text-base',
        'font-medium text-neutral-200',
        'outline outline-2 outline-offset-4 outline-transparent',
        'transition-all duration-150 ease-out',
        'hover:bg-neutral-800 hover:text-neutral-100 active:outline-focus',
        'disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-200',
        item.active && 'bg-neutral-800',
        className,
      )}
      onClick={item.onClickHandler}
    >
      {item.label}
    </button>
  )
}

function Tabs({ className, data, size = SizeTypes.Small }) {
  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {data.map(item => (
        <TabItem item={item} key={item.label} size={size} />
      ))}
    </div>
  )
}

export default Tabs
