import { useTranslations } from 'next-intl'
import React from 'react'

import cn from '@/utils/classes'

function SelectionItem({ className, item, isFull, isSmall, isTranslation = true }) {
  const t = useTranslations()

  return (
    <button
      type='button'
      className={cn(
        'cursor-pointer rounded-md px-2 py-1 text-nowrap!',
        'text-xs text-neutral-300',
        'outline-2 outline-offset-2 outline-transparent outline-solid lg:outline-offset-4',
        'transition-all duration-150 ease-out',
        'active:outline-focus hover:bg-neutral-700',
        item.active && 'bg-neutral-700 font-medium text-neutral-200',
        item.disabled && 'cursor-not-allowed outline-transparent',
        isFull && 'flex-1',
        !isSmall && 'lg:px-3 lg:py-2 lg:text-sm',
        className,
      )}
      onClick={item.onClickHandler}
    >
      {item.icon}
      {typeof item.label === 'number' ? `${item.label}%` : isTranslation ? t(item.label) : item.label}
    </button>
  )
}

function Selection({ className, classNames, data, isFull = false, isSmall = false, isTranslation = true }) {
  return (
    <div className={cn('inline-flex items-center justify-center gap-0.5 rounded-lg bg-neutral-800 p-1', className)}>
      {data.map((item, idx) => (
        <SelectionItem
          item={item}
          key={`selection-${idx}`}
          isFull={isFull}
          isSmall={isSmall}
          isTranslation={isTranslation}
          className={classNames?.items}
        />
      ))}
    </div>
  )
}

export default Selection
