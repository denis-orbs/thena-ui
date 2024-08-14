import { useTranslations } from 'next-intl'
import React from 'react'

import { SecondaryButton } from '@/components/buttons/Button'
import ChevronRightIcon from '@/modules/Story/ChevronRightIcon'

export default function CollectEnoughPoint() {
  const t = useTranslations()
  return (
    <div className='col-span-12 float-end my-auto flex h-[178px] w-[589.2px] flex-col justify-between gap-10 lg:col-span-6'>
      <p className='text-[40px] font-semibold text-neutral-50'>
        {t('Earn Points and Win Rewards by Reaching Top 300 on Leader board')}
      </p>
      <p className='leading-6 text-neutral-300'>
        <span className='font-bold'>{t('Collect enough points')}&nbsp;</span>
        {t('completing different tasks and reach to the top 300 on our leaderboard.')}
      </p>
      <SecondaryButton className='h-[44px] w-[188px] bg-[#DF08D4] px-1 text-neutral-100'>
        View leaderboard
        <ChevronRightIcon />
      </SecondaryButton>
    </div>
  )
}
