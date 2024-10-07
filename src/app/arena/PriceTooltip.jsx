import React from 'react'

import CustomTooltip from '@/components/tooltip'
import { cn } from '@/lib/utils'
import { ExpandDownIcon } from '@/svgs'

export default function PriceTooltip({ tooltip = '', id = '', className = '' }) {
  return (
    <div className={cn('flex flex-row items-center', className)}>
      <>
        <ExpandDownIcon className='h-5 w-5' data-tooltip-id={id} />
        <CustomTooltip
          className='z-50 min-w-[136px] max-w-[320px] !bg-neutral-500 shadow-xl after:!bg-neutral-500'
          id={id}
          place='bottom'
        >
          {tooltip}
        </CustomTooltip>
      </>
    </div>
  )
}
