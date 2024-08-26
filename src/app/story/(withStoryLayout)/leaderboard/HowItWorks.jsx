import { useTranslations } from 'next-intl'
import React from 'react'

import { HowItWorksItem } from '@/modules/Story/HowItWorksItem'
import { AwardIcon, CrownIcon, GiftIcon, StarLineWhiteIcon } from '@/svgs'

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
        <HowItWorksItem
          icon={AwardIcon}
          title={t('Reach Top 100 After Second Chapter')}
          description={t('Top 100 Thenians will receive rewards after second chapter via raffle method')}
        />
        <HowItWorksItem
          icon={CrownIcon}
          title={t('Reach Top 300 After All Chapters')}
          description={t('Top 300 Thenians will receive rewards after all chapters')}
        />
        <HowItWorksItem
          icon={GiftIcon}
          title={t('Claim Rewards')}
          description={t('Claim your rewards after the second and last chapter on the “Rewards” page')}
        />
      </div>
    </div>
  )
}
