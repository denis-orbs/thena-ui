import { useTranslations } from 'next-intl'
import React from 'react'

import { TextButton } from '@/components/buttons/Button'
import Divider from '@/components/divider'
import { NewTextSubHeading } from '@/components/typography'
import ArrowLeftIcon from '@/icons/ArrowLeftIcon'
import { cn } from '@/lib/utils'

function NavigationTop({ steps, currentStep, onPrev }) {
  const t = useTranslations()
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-1'>
        <TextButton
          onClick={onPrev}
          className={cn('p-2 max-lg:hidden', currentStep === 1 ? 'hidden' : '')}
          LeadingIcon={ArrowLeftIcon}
        />
        <NewTextSubHeading>{t(steps[currentStep - 1])}</NewTextSubHeading>
      </div>
      <Divider className='max-lg:hidden' />
    </div>
  )
}

export default NavigationTop
