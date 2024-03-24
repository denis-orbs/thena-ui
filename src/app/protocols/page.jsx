'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import { Neutral } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton, SecondaryButton } from '@/components/buttons/Button'
import { Paragraph, TextHeading } from '@/components/typography'
import { InfoIcon } from '@/svgs'

export default function ProtocolsPage() {
  const { push } = useRouter()
  const t = useTranslations()

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-2'>
          <h2>{t('Protocols')}</h2>
          <Paragraph>{t('Add a Gauge')}</Paragraph>
        </div>
        <Neutral className='justify-between lg:p-8'>
          <div className='flex items-center gap-4'>
            <InfoIcon className='h-4 w-4 min-w-fit stroke-neutral-600 lg:h-8 lg:w-8' />
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-xl'>{t('What are Gauges')}</TextHeading>
              <Paragraph>{t('Gauges Description')}</Paragraph>
            </div>
          </div>
          <EmphasisButton
            className='min-w-fit'
            responsive
            onClick={() => {
              window.open(
                'https://thena.gitbook.io/thena/the-open-marketplace-for-liquidity/whitelist-tokens',
                '_blank',
              )
            }}
          >
            {t('Learn More')}
          </EmphasisButton>
        </Neutral>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <Box className='flex items-center justify-between gap-2'>
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-lg'>{t('Gauge')}</TextHeading>
              <Paragraph>{t('Create New Gauge')}</Paragraph>
            </div>
            <SecondaryButton onClick={() => push('/protocols/gauge')}>{t('Add')}</SecondaryButton>
          </Box>
          <Box className='flex items-center justify-between gap-2'>
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-lg'>{t('Voting Incentive')}</TextHeading>
              <Paragraph>{t('Add a bribe reward for an existing gauge to incentivize votes on it')}</Paragraph>
            </div>
            <SecondaryButton onClick={() => push('/protocols/incentive')}>{t('Add')}</SecondaryButton>
          </Box>
        </div>
      </div>
      {/* <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
        <Highlight>
          <InfoCircleWhite className='h-4 w-4' />
        </Highlight>
        <div className='flex flex-col items-center gap-3'>
          <h2>Other inquiries?</h2>
          <Paragraph className='mt-3 text-center'>Reach out to us!</Paragraph>
        </div>
        <EmphasisButton>Support system</EmphasisButton>
      </div> */}
    </div>
  )
}
