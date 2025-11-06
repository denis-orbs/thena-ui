import React from 'react'

import CustomTooltip from '@/components/tooltip'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import { cn } from '@/lib/utils'

export default function PriceTooltip({ tooltip = [], id = '', className = '' }) {
  return (
    <div className={cn('flex flex-row items-center', className)}>
      <>
        <ChevronDownIcon className='h-5 w-5' data-tooltip-id={id} />
        <CustomTooltip id={id} className='max-w-[320px]' place='bottom'>
          {tooltip.map(item => (
            <p key={item}>{item}</p>
          ))}
        </CustomTooltip>
      </>
    </div>
  )
}
