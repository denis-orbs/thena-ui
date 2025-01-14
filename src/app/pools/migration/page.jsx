'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Loading from '@/app/loading'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useManuals } from '@/context/manualsContext'
import { useVaults } from '@/context/vaultsContext'
import { GaugeItemNotStaked, GaugeItemStaked, ManualMigrationPage } from '@/modules/Pools/Migration'
import { usePools } from '@/state/pools/hooks'
import { ArrowLeftIcon, ArrowRightIcon } from '@/svgs'

export default function MigrationPage() {
  const t = useTranslations()
  const { push } = useRouter()
  const searchParams = useSearchParams()
  const tokenId = searchParams.get('tokenId')
  const address = searchParams.get('address')

  const pools = usePools()
  const vaults = useVaults()
  const userManuals = useManuals()
  const userPools = useMemo(() => [...pools, ...vaults].filter(item => item.account.totalLp.gt(0)), [pools, vaults])

  const positionV2 = useMemo(() => {
    if (address) {
      return userPools.find(ele => ele?.address.toLowerCase() === address.toLowerCase())
    }

    if (tokenId) {
      return userManuals.find(ele => ele.tokenId === +tokenId && ele.version === 2)
    }
  }, [userPools, address, tokenId, userManuals])

  if (!positionV2) {
    return <Loading />
  }

  if (tokenId) {
    return <ManualMigrationPage tokenId={tokenId} />
  }

  return (
    <div className='mx-auto max-w-5xl'>
      <div className='h-11 w-[98px]'>
        <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/dashboard')}>
          {t('Back')}
        </TextButton>
      </div>

      <Box className='rounded-xl bg-neutral-900 px-3 py-6 lg:px-7'>
        <div className='mb-10 flex flex-col gap-2'>
          <TextHeading className='font-archia text-3xl'>{t('Migration')}</TextHeading>
          <TextSubHeading className='text-base text-neutral-300'>{t('Migration description')}</TextSubHeading>
        </div>

        <div className='mt-4 grid items-stretch gap-4 lg:grid-cols-[48%_2%_48%]'>
          <article className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2 text-lg'>{t('Your Current Gauge')}</TextHeading>
            {positionV2.account.walletBalance.gt(0) && <GaugeItemNotStaked pool={positionV2} />}
            {positionV2.account.gaugeBalance.gt(0) && <GaugeItemStaked pool={positionV2} />}
          </article>

          <span className='flex items-center justify-center'>
            <ArrowRightIcon className='mx-auto h-5 w-5 max-lg:rotate-90' />
          </span>

          <article className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2'>{t('Your New V3 Gauge')}</TextHeading>

            {positionV2.account.walletBalance.gt(0) && <GaugeItemNotStaked pool={positionV2} />}
            {positionV2.account.gaugeBalance.gt(0) && <GaugeItemStaked pool={positionV2} />}
          </article>
        </div>

        <Box className='mt-[30px] flex flex-row items-center justify-between gap-4 border border-primary-800 bg-primary-950'>
          <TextHeading className='text-neutral-100'>{t('During the migration all rewards will be')}</TextHeading>
        </Box>

        <div className='mt-6 flex flex-col justify-between gap-3 lg:flex-row'>
          <EmphasisButton className='w-full lg:w-[50%]' onClick={() => push('/dashboard')}>
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton className='w-full lg:w-[50%]'>{t('Migrate Now')}</PrimaryButton>
        </div>
      </Box>
    </div>
  )
}
