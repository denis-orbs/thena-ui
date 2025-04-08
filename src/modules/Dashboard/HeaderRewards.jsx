import { useTranslations } from 'next-intl'
import React from 'react'

import { NewTextHeading, NewTextSubHeading } from '@/components/typography'

function HeaderRewards() {
  const t = useTranslations()
  return (
    <div className='absolute left-0 right-0 h-[120px] w-full bg-[url(/images/bg-dashboard.png)] bg-cover bg-center md:h-[262px]'>
      <div className='inset-0 flex h-full w-full items-center justify-center bg-[url(/images/rewards-claimable-bg.png)] bg-cover bg-center'>
        {/* TODO: responsive for mobile */}
        <div className='flex w-fit flex-col gap-2 text-center md:gap-4'>
          <NewTextHeading className='text-primary-500 xl:text-[72px]'>$ 644.98</NewTextHeading>
          <NewTextSubHeading className='font-archia font-semibold uppercase xl:text-4xl'>
            {t('total rewads claimable')}
          </NewTextSubHeading>
        </div>
      </div>
    </div>
  )
}

export default HeaderRewards
