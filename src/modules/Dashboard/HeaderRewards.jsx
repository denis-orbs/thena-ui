import { useTranslations } from 'next-intl'
import React from 'react'

import { NewTextHeading, NewTextSubHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'

function HeaderRewards({ totalUsd }) {
  const t = useTranslations()
  return (
    <div className='h-[120px] w-full bg-[url(/images/bg-dashboard.png)] bg-cover bg-center md:h-[161px]'>
      <div className='inset-0 flex h-full w-full items-center justify-center bg-[url(/images/rewards-claimable-bg1.png)] bg-cover bg-center py-7'>
        <div className='flex w-fit flex-col gap-2 text-center md:gap-4'>
          <NewTextHeading className='bg-gradient-to-b from-[#F199EE] to-[#DC00D4] bg-clip-text text-[60px] text-transparent md:text-5xl md:text-primary-500'>
            $ {formatAmount(totalUsd)}
          </NewTextHeading>
          <NewTextSubHeading className='font-archia text-sm font-bold uppercase max-md:text-primary-200 md:text-3xl md:font-semibold'>
            {t('total rewards claimable')}
          </NewTextSubHeading>
        </div>
      </div>
    </div>
  )
}

export default HeaderRewards
