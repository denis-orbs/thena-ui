import { useTranslations } from 'next-intl'
import React from 'react'

import { TextButton } from '@/components/buttons/Button'
import Divider from '@/components/divider'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

function NavigationTop({ steps, currentStep, onPrev }) {
  const t = useTranslations()
  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-1'>
        <TextButton
          onClick={onPrev}
          className={cn('p-2', currentStep === 1 ? 'hidden' : '')}
          LeadingIcon={ArrowLeftIcon}
        />
        <TextHeading className='font-archia text-2xl font-semibold lg:text-3xl'>
          {t(steps[currentStep - 1])}
        </TextHeading>
      </div>
      <Divider />
    </div>
  )
}

export default NavigationTop
