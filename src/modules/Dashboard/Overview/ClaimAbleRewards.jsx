import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'

function ClaimAbleRewards() {
  const t = useTranslations()
  return (
    <Box className='flex h-full flex-col justify-between !p-4'>
      <TextHeading className='font-archia text-xl'>{t('Claimable Rewards')}</TextHeading>
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <div style={{ width: '60%' }} className='rounded-e-md bg-primary-400 px-1.5 py-2 text-primary-950'>
            {t('Farmed')}
          </div>
          <TextHeading>${formatAmount(1325)}</TextHeading>
        </div>
        <div className='flex items-center gap-2'>
          <div style={{ width: '50%' }} className='rounded-e-md bg-primary-800 px-1.5 py-2 text-primary-950'>
            {t('Voting')}
          </div>
          <TextHeading>${formatAmount(1325)}</TextHeading>
        </div>
        <div className='flex items-center gap-2'>
          <div style={{ width: '70%' }} className='rounded-e-md bg-primary-800 px-1.5 py-2 text-primary-950'>
            {t('TheNFT')}
          </div>
          <TextHeading>${formatAmount(1325)}</TextHeading>
        </div>
      </div>
      <Paragraph>
        {t('last 24 Hours')} <span className='text-primary-600'>+ ${formatAmount(32.48)}</span>
      </Paragraph>
      <TextSubHeading>
        {t('Total')} <span className='text-primary-300'>${formatAmount(2048.67)}</span>
      </TextSubHeading>
      <EmphasisButton>{t('Claim')}</EmphasisButton>
    </Box>
  )
}

export default ClaimAbleRewards
