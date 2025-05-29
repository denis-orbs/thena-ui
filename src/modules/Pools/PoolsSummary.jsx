import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import { Paragraph, TextHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'
import { CoinsStackedIcon } from '@/svgs'

function PoolsSummary({ pools }) {
  const t = useTranslations()
  return (
    <div className='flex flex-row items-center justify-between gap-10'>
      <div className='flex items-center gap-8'>
        <CoinsStackedIcon className='h-[86px] w-[86px]' />
        <TextHeading className='font-archia text-[96px] font-semibold'>{t('Pools')}</TextHeading>
      </div>
      {/* TODO: replace mock data */}
      <Box className='ml-auto flex flex-row gap-10'>
        <div className='flex flex-col gap-3'>
          <TextHeading className='font-archia text-gradient-primary-start text-3xl font-semibold'>
            {pools.length}
          </TextHeading>
          <Paragraph className='text-neutral-500'>{t('Number of pools')}</Paragraph>
        </div>
        <div className='flex flex-col gap-3'>
          <TextHeading className='font-archia text-gradient-primary-start text-3xl font-semibold'>
            ${formatAmount(15373984)}
          </TextHeading>
          <Paragraph className='text-neutral-500'>{t('7D Volume')}</Paragraph>
        </div>

        <div className='flex flex-col gap-3'>
          <TextHeading className='font-archia text-gradient-primary-start text-3xl font-semibold'>
            ${formatAmount(5373)}
          </TextHeading>
          <Paragraph className='text-neutral-500'>{t('7D Fees')}</Paragraph>
        </div>
        <div className='flex flex-col gap-3'>
          <TextHeading className='font-archia text-gradient-primary-start text-3xl font-semibold'>
            ${formatAmount(93473141)}
          </TextHeading>
          <Paragraph className='text-neutral-500'>{t('TVL Lending')}</Paragraph>
        </div>
        <div className='flex flex-col gap-3'>
          <TextHeading className='font-archia text-gradient-primary-start text-3xl font-semibold'>
            ${formatAmount(93473141)}
          </TextHeading>
          <Paragraph className='text-neutral-500'>{t('TVL Borowed')}</Paragraph>
        </div>
      </Box>
    </div>
  )
}

export default PoolsSummary
