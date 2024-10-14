import Link from 'next/link'
import React from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { cn } from '@/lib/utils'

function MenuTab({ menuData, className }) {
  return (
    <div className={cn('flex w-fit items-center gap-[2px] rounded-[8px] bg-neutral-800 p-1 lg:gap-1', className)}>
      {menuData.map((item, index) => (
        <EmphasisButton
          key={`${item.title}_${index}`}
          onClick={item?.onClick}
          className={cn('px-3 py-2', item.isActive ? 'bg-neutral-600' : 'bg-transparent')}
        >
          {item.isLink ? (
            <Link href={item.url} className='text-xs lg:text-sm' prefetch={false}>
              {item.title}
            </Link>
          ) : (
            <span className='text-xs lg:text-sm'>{item.title}</span>
          )}
        </EmphasisButton>
      ))}
    </div>
  )
}

export default MenuTab
