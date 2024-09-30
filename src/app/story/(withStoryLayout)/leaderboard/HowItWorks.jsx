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
          title={t('Complete Tasks and Stack Points')}
          description={t('Complete Tasks and Stack Points Description')}
        />
        <HowItWorksItem
          icon={AwardIcon}
          title={t('Score Rewards with Every Chapter')}
          description={t('Score Rewards with Every Chapter Description')}
        />
        <HowItWorksItem
          icon={CrownIcon}
          title={t('Hit the Top 300 and Share')}
          description={t('Hit the Top 300 and Share Description')}
        />
        <HowItWorksItem
          icon={GiftIcon}
          title={t('Mint Your NFT and Unlock VIP Perks')}
          description={t('Mint Your NFT and Unlock VIP Perks Description')}
        />
      </div>
    </div>
  )
}
