import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useVeTheAutomations } from '@/hooks/automationContract/useAutomationContract'
import { useCountdown } from '@/hooks/useCountdown'
import usePrices from '@/hooks/usePrices'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { formatAmount } from '@/lib/utils'
import { InfoNeutralIcon } from '@/svgs'

import AutomationStatus from '../AutomationStatus'

function LockDetails({ contractData, veTHE }) {
  const t = useTranslations()
  const prices = usePrices()
  const { data: veTHEs, isLoading } = useVeTheAutomations()
  const found = veTHEs?.find(item => item.id === veTHE.id)
  const { text } = useCountdown(EVENT_TYPES.LIVE, contractData.settings.executionTime / 1000, true)

  return (
    <div className='space-y-4'>
      <div className='hidden bg-[#0000F5]' />
      <TextHeading className='font-archia text-2xl lg:text-3xl'>{t('Lock Details')}</TextHeading>
      <div className='grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-6'>
        <Box className='flex w-full flex-col gap-2'>
          <div className='flex items-center gap-4'>
            {new Date().getTime() <= contractData.settings.executionTime && <TextHeading>{text}</TextHeading>}
            <AutomationStatus veTHEId={veTHE.id} />
          </div>
          <Paragraph className='text-sm'>{t('Automation Status')}</Paragraph>
        </Box>
        <Box className='flex w-full flex-col gap-2'>
          {veTHE.id ? (
            <TextHeading className='text-xl lg:text-2xl'>{veTHE.id}</TextHeading>
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
            <TextHeading className='text-2xl'>{formatAmount(found?.balanceAuto)}</TextHeading>
          </div>
          <Paragraph className='text-sm'>{t('Current LINK balance')}</Paragraph>
        </Box>
        <Box className='flex w-full flex-col gap-2'>
          {found?.minBalanceAuto ? (
            <div className='flex items-center gap-1'>
              <TextHeading className='text-2xl'>{formatAmount(found?.minBalanceAuto)}</TextHeading>
              <InfoNeutralIcon className='h-4 w-4' data-tooltip-id='minimum-link-balance-required' />
              <CustomTooltip id='minimum-link-balance-required' className='max-w-[350px]'>
                {t('Minimum LINK balance required desc')}
              </CustomTooltip>
            </div>
          ) : (
            <Skeleton className='h-8 w-20' />
          )}
          <Paragraph className='text-sm'>{t('Minimum LINK balance required')}</Paragraph>
        </Box>
        <Box className='col-span-2 flex w-full flex-col gap-2 lg:col-span-1'>
          <div className='flex items-center gap-1'>
            {isLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <TextHeading className='text-2xl'>
                {found?.operations?.isRelockEveryWeek
                  ? t('Automated')
                  : veTHE.expire > 0
                    ? t('Expires in [x] days', { x: veTHE.expire })
                    : `Expired ${(veTHE.expire || 0) * -1} days ago`}
              </TextHeading>
            )}
          </div>
          <Paragraph className='text-sm'>{t('Lock expire')}</Paragraph>
        </Box>
      </div>
    </div>
  )
}

export default LockDetails
