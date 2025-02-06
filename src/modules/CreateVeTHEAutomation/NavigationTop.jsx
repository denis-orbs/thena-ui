import { useTranslations } from 'next-intl'
import React from 'react'

import { TextButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

function NavigationTop({ steps, currentStep, onPrev }) {
  const t = useTranslations()
  return (
    <div className='flex items-center'>
      <TextButton onClick={onPrev} className={cn('', currentStep === 1 ? 'hidden' : '')} LeadingIcon={ArrowLeftIcon} />
      <TextHeading className='font-archia text-2xl font-semibold lg:text-3xl'>{t(steps[currentStep - 1])}</TextHeading>
    </div>
  )
}

export default NavigationTop
