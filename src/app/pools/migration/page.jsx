'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon, ArrowNarrowUpRightIcon, ArrowRightIcon } from '@/svgs'

import AdjustNewPositionModal from './AdjustNewPositionModal'

function Tag({ tagName, className }) {
  return (
    <div
      className={cn(
        'relative items-center rounded-lg py-[8.4px] pl-6 pr-8 text-xs text-white disabled:cursor-not-allowed',
        className,
      )}
    >
      {tagName}
    </div>
  )
}

// const migration = 'alm'
// // const migrationType = 'staked'
// const migrationType = 'notStaked'

const migration = 'manual'
// const migrationType = 'in'
const migrationType = 'out'

function GaugeItem({ showAdjustButton = false }) {
  const [isOpenAdjust, setIsOpenAdjust] = useState(false)
  const t = useTranslations()

  const tagName = useMemo(() => {
    if (migration === 'alm') {
      return migrationType === 'staked' ? 'Staked' : 'Not Staked'
    }
    return migrationType === 'in' ? 'In Range' : 'Out of Range'
  }, [])

  return (
    <div className='flex h-full flex-col gap-3 rounded-xl border border-neutral-600 p-4 lg:p-6'>
      <div className='flex flex-col gap-3'>
        <div className='flex flex-row justify-between'>
          <div className='flex flex-row'>
            <IconGroup
              className='-space-x-2'
              classNames={{
                image: 'outline-2 w-7 h-7',
              }}
              logo1='https://cdn.thena.fi/assets/THE.png'
              logo2='https://cdn.thena.fi/assets/BTCB.png'
            />
            <div className='flex flex-col'>
              <TextHeading>BTCB/THE</TextHeading>
              <Paragraph className='text-sm'>Narrow</Paragraph>
            </div>
          </div>
          <Tag
            tagName={tagName}
            className={cn(
              'h-fit w-fit rounded-full px-2 py-[2px] text-success-100',
              tagName === 'Staked' || tagName === 'In Range' ? 'bg-success-600' : 'bg-primary-600',
            )}
          />
        </div>
        {migration === 'alm' && (
          <div className='flex flex-row justify-between'>
            <Paragraph>APR</Paragraph>
            <TextHeading>20%</TextHeading>
          </div>
        )}
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Deposit Value in USD')}</Paragraph>
          <TextHeading>$123.45</TextHeading>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('WBNB Deposit')}</Paragraph>
          <TextHeading>
            1 <Paragraph>(50%)</Paragraph>
          </TextHeading>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('THE Deposit')}</Paragraph>
          <TextHeading>
            999 <Paragraph>(50%)</Paragraph>
          </TextHeading>
        </div>
        {migration === 'alm' && migrationType === 'staked' && (
          <div className='flex flex-row justify-between'>
            <Paragraph>{t('Net Return')}</Paragraph>
            <TextHeading>$113.45</TextHeading>
          </div>
        )}
      </div>
      <div className='gap-3 border-t border-t-neutral-600 py-3'>
        <Paragraph>{t('Price Range')}</Paragraph>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Min Price')}</Paragraph>
          <TextHeading>
            4.1203 <Paragraph>(BNB per ETH)</Paragraph>
          </TextHeading>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Max Price')}</Paragraph>
          <TextHeading>
            4.1203 <Paragraph>(BNB per ETH)</Paragraph>
          </TextHeading>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Current Price')}</Paragraph>
          <TextHeading>
            4.1203 <Paragraph>(BNB per ETH)</Paragraph>
          </TextHeading>
        </div>
        {showAdjustButton && (
          <EmphasisButton onClick={() => setIsOpenAdjust(true)} className='mt-3 w-full'>
            {t('Adjust New Position')}
          </EmphasisButton>
        )}
      </div>
      <AdjustNewPositionModal isOpen={isOpenAdjust} onClose={() => setIsOpenAdjust(false)} />
    </div>
  )
}

// TODO: Replace mock data

export default function MigrationPage() {
  const t = useTranslations()
  const { push } = useRouter()
  return (
    <div className='mx-auto flex flex-col lg:flex-row'>
      <div className='h-11 w-[98px]'>
        <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/pools')}>
          {t('Back')}
        </TextButton>
      </div>
      <Box className='rounded-xl bg-neutral-900 px-3 py-6 lg:px-7'>
        <div className='flex flex-col gap-2'>
          <TextHeading className='font-archia text-3xl'>{t('Migration')}</TextHeading>
          <TextSubHeading className='text-base text-neutral-300'>
            {t('Migration description')}&nbsp;
            <span className='flex items-center text-primary-600'>
              {t('KyberSwap migration contract')}&nbsp;
              <ArrowNarrowUpRightIcon className='h-3 w-3 !stroke-primary-600' />
            </span>
          </TextSubHeading>
        </div>
        <div className='mt-4 flex flex-col items-center gap-4 lg:flex-row lg:items-stretch'>
          <div className='flex h-full w-full flex-col lg:w-[48%]'>
            <TextHeading className='mb-2'>{t('Your Current Gauge')}</TextHeading>
            <GaugeItem />
          </div>
          <div className='flex w-full items-center justify-center lg:w-[4%]'>
            <ArrowRightIcon className='mx-auto h-5 w-5 max-lg:rotate-90' />
          </div>
          <div className='flex h-full w-full flex-col lg:w-[48%]'>
            <TextHeading className='mb-2'>{t('Your New V3 Gauge')}</TextHeading>
            <GaugeItem showAdjustButton />
          </div>
        </div>

        <Box className='mt-[30px] flex flex-row items-center justify-between gap-4 border border-primary-800 bg-primary-950'>
          <TextHeading className='text-neutral-100'>{t('During the migration all rewards will be')}</TextHeading>
        </Box>
        <div className='mt-6 flex flex-col justify-between gap-3 lg:flex-row'>
          <EmphasisButton className='w-full lg:w-[50%]'>{t('Cancel')}</EmphasisButton>
          <PrimaryButton className='w-full lg:w-[50%]'>{t('Migrate Now')}</PrimaryButton>
        </div>
      </Box>
    </div>
  )
}
