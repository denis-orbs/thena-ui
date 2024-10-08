import React from 'react'

import CustomTooltip from '@/components/tooltip'
import { cn } from '@/lib/utils'
import { ExpandDownIcon } from '@/svgs'

export default function PriceTooltip({ tooltip = [], id = '', className = '' }) {
  return (
    <div className={cn('flex flex-row items-center', className)}>
      <>
        <ExpandDownIcon className='h-5 w-5' data-tooltip-id={id} />
        <CustomTooltip id={id} className='max-w-[320px]' place='bottom'>
          {tooltip.map(item => (
            <p key={item}>{item}</p>
          ))}
        </CustomTooltip>
      </>
    </div>
  )
}
