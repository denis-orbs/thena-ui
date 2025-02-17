import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { Paragraph, TextHeading } from '@/components/typography'
import { CoinsHandIcon } from '@/svgs'

import PieChart from './PieChart'
import PoolOverviewTable from './PoolOverviewTable'
import WeightedPoolLogo from './WeightedPoolLogo'

export default function Preview({ tokensAndWeights, setCurrentStep, fees, poolName }) {
  const t = useTranslations()
  return (
    <div className='space-y-4'>
      <TextHeading className='font-archia text-3xl font-semibold'>{t('Overview')}</TextHeading>
      <Box className='space-y-8'>
        <div className='flex items-center gap-4'>
          <div className='flex flex-[4] gap-4'>
            <div className='space-y-2'>
              <WeightedPoolLogo
                height={24}
                width={24}
                tokens={tokensAndWeights.map(token => ({ ...token.token, weight: token.weight }))}
              />
              <Paragraph className='text-xs'>{t('Weighted Pool')}</Paragraph>
            </div>
            <div className='space-y-2'>
              <div>
                <TextHeading>$ TODO</TextHeading>
              </div>
              <div className='flex gap-3'>
                <CoinsHandIcon className='h-5 w-5' />
                <Paragraph>{`Fees ${fees} %`}</Paragraph>
              </div>
            </div>
          </div>
          <div className='flex-[6]'>
            <TextHeading className='font-archia text-3xl font-semibold lg:text-[40px] lg:leading-[48px]'>
              {poolName}
            </TextHeading>
          </div>
        </div>
        <div className='flex gap-4'>
          <div className='flex-[4]'>
            <PieChart tokensAndWeights={tokensAndWeights} />
          </div>
          <div className='flex-[6]'>
            <PoolOverviewTable tokens={tokensAndWeights} />
          </div>
        </div>
      </Box>
      <PrimaryButton className='w-full'>{t('Deposit')}</PrimaryButton>
      <div className='flex flex-col gap-4 lg:flex-row'>
        <EmphasisButton className='w-full lg:w-fit' onClick={() => setCurrentStep(prev => prev - 1)}>
          {t('Back')}
        </EmphasisButton>
        <PrimaryButton className='w-full lg:w-fit'>{t('Cancel')}</PrimaryButton>
      </div>
    </div>
  )
}
