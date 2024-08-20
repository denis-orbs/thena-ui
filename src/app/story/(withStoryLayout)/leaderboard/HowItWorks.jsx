import { useTranslations } from 'next-intl'
import React from 'react'

import { HowItWorksItem } from '@/modules/Story/HowItWorksItem'
import { StarLineWhiteIcon } from '@/svgs'

export default function HowItWorks() {
  const t = useTranslations()
  return (
    <div>
      <p className='mb-10 text-3xl font-semibold'>{t('How it Works')}</p>
      <div className='flex flex-col justify-between md:flex-row'>
        <HowItWorksItem
          icon={StarLineWhiteIcon}
          title={t('Earn Points')}
          description={t('Accumulate points through referrals, daily swap-ins, and task completion')}
        />
        {/* TODO: Change Icons */}
        <HowItWorksItem
          icon={StarLineWhiteIcon}
          title={t('Reach Top 100 on Leaderboard')}
          description={t('Top 100 Thenians will receive all kind of rewards')}
        />
        <HowItWorksItem
          icon={StarLineWhiteIcon}
          title={t('Receive Rewards')}
          description={t('Receive rewards like veTHE, thenaid, and other')}
        />
      </div>
    </div>
  )
}
