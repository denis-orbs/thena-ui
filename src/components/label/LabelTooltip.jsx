import { useTranslations } from 'next-intl'
import React from 'react'

import CustomTooltip from '@/components/tooltip'
import { cn } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

export default function LabelTooltip({
  label = '',
  showInfoIcon = false,
  tooltip = '',
  id = '',
  className = '',
  translate = true,
  required = false,
}) {
  const t = useTranslations()

  return (
    <div className={cn('mb-2 flex flex-row items-center', className)}>
      <p className='font-medium text-neutral-50'>
        {label && typeof label === 'string' ? (translate ? t(label) : label) : ''}{' '}
        {required ? <span className='text-red-500'>*</span> : ''}
      </p>
      {showInfoIcon && (
        <>
          <InfoIcon className='ml-[6px] h-4 w-4 stroke-neutral-400' data-tooltip-id={id} />
          <CustomTooltip
            className='z-50 max-w-[320px] min-w-[136px] bg-neutral-500! shadow-xl after:bg-neutral-500!'
            id={id}
            place='right'
          >
            {translate ? t(tooltip) : tooltip}
          </CustomTooltip>
        </>
      )}
    </div>
  )
}
