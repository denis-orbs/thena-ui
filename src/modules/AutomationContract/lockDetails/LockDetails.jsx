import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useCountdown } from '@/hooks/useCountdown'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount } from '@/lib/utils'

import AutomationStatus from '../AutomationStatus'

function LockDetails({ contractData }) {
  const t = useTranslations()

  console.log({ executionTime: contractData.settings.executionTime })
  const { text } = useCountdown(EVENT_TYPES.LIVE, contractData.settings.executionTime / 1000, true)

  return (
    <div className='space-y-4'>
      <div className='hidden bg-[#0000F5]' />
      <TextHeading className='font-archia text-2xl lg:text-3xl'>{t('Lock Details')}</TextHeading>
      <div className='grid grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-6'>
        <Box className='flex w-full flex-col gap-2'>
          <div className='flex items-center gap-4'>
            {new Date().getTime() <= contractData.settings.executionTime && <TextHeading>{text}</TextHeading>}
            <AutomationStatus veTHEId={contractData?.veTHEId} />
          </div>
          <Paragraph className='text-sm'>{t('Automation Status')}</Paragraph>
        </Box>
        <Box className='flex w-full flex-col gap-2'>
          {contractData?.veTHEId ? (
            <TextHeading className='text-xl lg:text-2xl'>{contractData?.veTHEId}</TextHeading>
          ) : (
            <Skeleton className='h-8 w-14' />
          )}
          <Paragraph className='text-sm'>{t('veTHE ID')}</Paragraph>
        </Box>
        <Box className='flex w-full flex-col gap-2'>
          <div className='flex items-center gap-1'>
            <CircleImage className='h-5 w-5' src='https://cdn.thena.fi/assets/THE.png' alt='thena logo' />
            <div className='flex items-center gap-1'>
              <TextHeading className='text-2xl'>{formatAmount(123)}TODO</TextHeading>
              <TextSubHeading>${formatAmount(123)}TODO</TextSubHeading>
            </div>
          </div>
          <Paragraph className='text-sm'>{t('Lock amount')}</Paragraph>
        </Box>
        <Box className='flex w-full flex-col gap-2'>
          <div className='flex items-center gap-1'>
            <CircleImage className='h-5 w-5' src='https://cdn.thena.fi/assets/THE.png' alt='thena logo' />
            <div className='flex items-center gap-1'>
              <TextHeading className='text-2xl'>{formatAmount(123)}TODO</TextHeading>
              <TextSubHeading>${formatAmount(123)}TODO</TextSubHeading>
            </div>
          </div>
          <Paragraph className='text-sm'>{t('Lock Value')}</Paragraph>
        </Box>
        <Box className='col-span-2 flex w-full flex-col gap-2 lg:col-span-1'>
          <div className='flex items-center gap-1'>
            <TextHeading className='text-2xl'>{t('Automated')}TODO</TextHeading>
          </div>
          <Paragraph className='text-sm'>{t('Lock expire')}</Paragraph>
        </Box>
      </div>
    </div>
  )
}

export default LockDetails
