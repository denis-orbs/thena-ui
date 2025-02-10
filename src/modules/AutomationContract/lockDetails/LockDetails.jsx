import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useGetMaxPaymentForGas } from '@/hooks/automationContract/useAutomationContract'
import { useCountdown } from '@/hooks/useCountdown'
import usePrices from '@/hooks/usePrices'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount, fromWei } from '@/lib/utils'

import AutomationStatus from '../AutomationStatus'

function LockDetails({ contractData, veTHE }) {
  const t = useTranslations()
  const prices = usePrices()
  const { text } = useCountdown(EVENT_TYPES.LIVE, contractData.settings.executionTime / 1000, true)
  const maxPaymentForGas = useGetMaxPaymentForGas()

  return (
    <div className='space-y-4'>
      <div className='hidden bg-[#0000F5]' />
      <TextHeading className='font-archia text-2xl lg:text-3xl'>{t('Lock Details')}</TextHeading>
      <div className='grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-6'>
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
              <TextHeading className='text-2xl'>{formatAmount(veTHE?.voting_amount)}</TextHeading>
              <TextSubHeading>${formatAmount((prices?.THE || 0) * (veTHE?.voting_amount || 0))}</TextSubHeading>
            </div>
          </div>
          <Paragraph className='text-sm'>{t('Lock Value')}</Paragraph>
        </Box>
        <Box className='flex w-full flex-col gap-2'>
          <div className='flex items-center gap-1'>
            <CircleImage className='h-5 w-5' src='https://cdn.thena.fi/assets/THE.png' alt='thena logo' />
            <div className='flex items-center gap-1'>
              <TextHeading className='text-2xl'>{formatAmount(veTHE?.amount || 0)}</TextHeading>
              <TextSubHeading>${formatAmount((prices?.THE || 0) * (veTHE?.amount || 0) || 0)}</TextSubHeading>
            </div>
          </div>
          <Paragraph className='text-sm'>{t('Lock amount')}</Paragraph>
        </Box>
        <Box className='flex w-full flex-col gap-2'>
          <div className='flex items-center gap-1'>
            <TextHeading className='text-2xl'>{formatAmount(fromWei(contractData.balance))}</TextHeading>
          </div>
          <Paragraph className='text-sm'>{t('Current LINK balance')}</Paragraph>
        </Box>
        <Box className='flex w-full flex-col gap-2'>
          <div className='flex items-center gap-1'>
            <TextHeading className='text-2xl'>{formatAmount(maxPaymentForGas)}</TextHeading>
          </div>
          <Paragraph className='text-sm'>{t('Minimum LINK balance required')}</Paragraph>
        </Box>
        <Box className='col-span-2 flex w-full flex-col gap-2 lg:col-span-1'>
          <div className='flex items-center gap-1'>
            <TextHeading className='text-2xl'>{t('Automated')}</TextHeading>
          </div>
          <Paragraph className='text-sm'>{t('Lock expire')}</Paragraph>
        </Box>
      </div>
    </div>
  )
}

export default LockDetails
