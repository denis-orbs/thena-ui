import { useTranslations } from 'next-intl'
import React from 'react'

import { cn } from '@/lib/utils'

function SelectionItem({ className, item, isFull, isSmall }) {
  const t = useTranslations()

  return (
    <button
      type='button'
      className={cn(
        'cursor-pointer rounded-md px-2 py-1',
        'text-xs text-neutral-300',
        'outline outline-2 outline-offset-4 outline-transparent',
        'transition-all duration-150 ease-out',
        'hover:bg-neutral-700 active:outline-focus',
        item.active && 'bg-neutral-700 font-medium text-neutral-200',
        item.disabled && 'cursor-not-allowed outline-transparent',
        className,
        isFull && 'flex-1',
        !isSmall && 'lg:px-3 lg:py-2 lg:text-sm',
      )}
      onClick={item.onClickHandler}
    >
      {typeof item.label === 'number' ? `${item.label}%` : t(item.label)}
    </button>
  )
}

function Selection({ className, data, isFull = false, isSmall = false }) {
  return (
    <div className={cn('inline-flex items-center justify-center gap-0.5 rounded-lg bg-neutral-800 p-1', className)}>
      {data.map((item, idx) => (
        <SelectionItem item={item} key={`selection-${idx}`} isFull={isFull} isSmall={isSmall} />
      ))}
    </div>
  )
}

export default Selection
