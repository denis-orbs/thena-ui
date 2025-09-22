import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { SizeTypes } from '@/constant/type'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

function TabItem({ className, item, size, disabled }) {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const queryString = useMemo(() => (searchParams.get('q') ? `?q=${searchParams.get('q')}` : ''), [searchParams])

  return item.isLink ? (
    <Link href={item.href + queryString}>
      <div
        type='button'
        className={cn(
          'cursor-pointer rounded-lg px-4 py-2.5 text-nowrap',
          'rounded px-3 py-2 text-xs',
          size === SizeTypes.Medium && 'lg:rounded-lg lg:px-4 lg:py-2.5 lg:text-base',
          'font-medium text-neutral-200',
          'outline-2 outline-offset-4 outline-transparent outline-solid',
          'transition-all duration-150 ease-out',
          'active:outline-focus hover:bg-neutral-800 hover:text-neutral-100',
          'disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500',
          item.active && 'bg-neutral-800',
          className,
        )}
        disabled={disabled}
        onClick={item.onClickHandler}
      >
        {t(item.label)}
      </div>
    </Link>
  ) : (
    <button
      type='button'
      className={cn(
        'cursor-pointer rounded-lg px-4 py-2.5 text-nowrap',
        'rounded px-3 py-2 text-xs',
        size === SizeTypes.Medium && 'lg:rounded-lg lg:px-4 lg:py-2.5 lg:text-base',
        'font-medium text-neutral-200',
        'outline-2 outline-offset-4 outline-transparent outline-solid',
        'transition-all duration-150 ease-out',
        'active:outline-focus hover:bg-neutral-800 hover:text-neutral-100',
        'disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500',
        item.active && 'bg-neutral-800',
        className,
      )}
      onClick={item.onClickHandler}
      disabled={disabled}
    >
      {t(item.label)}
    </button>
  )
}

function Tabs({ className, data, size = SizeTypes.Small, itemClassName, itemsActiveClass }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const handleMouseEnter = index => {
    setHoveredIndex(index)
  }

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {data.map((item, index) =>
        item.isSub ? (
          <div
            key={item.label}
            className='relative'
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className={cn(
                'flex items-center rounded-xs px-1 hover:bg-neutral-800 hover:text-neutral-100',
                item.active && 'bg-neutral-800',
                item.active && itemsActiveClass,
              )}
            >
              <TabItem item={item} size={size} className={itemClassName} disabled={item.disabled || false} />
              <ChevronDownIcon
                className={cn(
                  'h-5 w-5 transform transition-all duration-150 ease-out',
                  hoveredIndex === index ? 'rotate-180' : 'rotate-0',
                )}
              />
            </div>
            {hoveredIndex === index && (
              <ul
                className={cn(
                  'absolute rounded-xl border border-neutral-700 bg-neutral-900 p-4 hover:rounded-xl hover:border-neutral-500',
                  item.classNameSub || '',
                )}
              >
                {item?.sub.map(
                  (sub, idx) =>
                    sub && (
                      <TabItem
                        item={sub}
                        key={`${sub.label}_${idx}`}
                        size={size}
                        className={itemClassName}
                        disabled={sub.disabled || false}
                      />
                    ),
                )}
              </ul>
            )}
          </div>
        ) : (
          <TabItem
            item={item}
            key={item.label}
            size={size}
            className={itemClassName}
            disabled={item.disabled || false}
          />
        ),
      )}
    </div>
  )
}

export function TabPanel({ children, value, select, ...other }) {
  return (
    <div
      role='tabpanel'
      hidden={value !== select}
      id={`simple-tabpanel-${select}`}
      aria-labelledby={`simple-tab-${select}`}
      {...other}
    >
      {value === select && <div className='flex w-full flex-col gap-4'>{children}</div>}
    </div>
  )
}

export default Tabs
