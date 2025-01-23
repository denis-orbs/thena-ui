'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import Selector from '@/components/selector'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { ICHI_TYPES } from '@/constant'
import { useVaults } from '@/context/vaultsContext'
import { useGammaMigration } from '@/hooks/fusion/useGamma'
import { useMigrationIchi } from '@/hooks/fusion/useIchi'
import { formatAmount, getDisplayedStrategy } from '@/lib/utils'
import { GaugeItem } from '@/modules/Pools/Migration'
import { useGetAutoPoolMigration, usePools } from '@/state/pools/hooks'
import { ArrowLeftIcon, ArrowRightIcon } from '@/svgs'

export function AutoMigrationPage({ address, staked }) {
  const t = useTranslations()
  const { push } = useRouter()
  const [strategy, setStrategy] = useState()
  const { migrateGamma } = useGammaMigration()
  const { migrateIchi } = useMigrationIchi()

  const pools = usePools()
  const vaults = useVaults()
  const userPools = useMemo(() => [...pools, ...vaults].filter(item => item.account.totalLp.gt(0)), [pools, vaults])

  const positionV2 = useMemo(() => {
    if (address) {
      return userPools.find(ele => ele?.address.toLowerCase() === address.toLowerCase())
    }
  }, [address, userPools])

  const migrationOptions = useGetAutoPoolMigration({
    token0Address: positionV2?.token0?.address,
    token1Address: positionV2?.token1?.address,
    type: positionV2?.title,
    version: positionV2?.account?.version,
  })

  const strategyData = useMemo(() => {
    const subPools = migrationOptions?.map(sub => {
      const { type } = sub
      let isFarming = false

      if (type?.includes('Farming')) {
        isFarming = true
      }

      const strategyInfo = {
        ...sub,
        type: 'auto',
        isFarming,
      }

      return {
        content: (
          <div className='flex flex-1 items-center justify-between'>
            <div>
              <TextHeading>{getDisplayedStrategy(type)}</TextHeading>
              <div className='mt-1 flex gap-2'>
                <div className='flex items-center gap-1'>
                  <TextHeading className='text-sm'>{t('APR')}:</TextHeading>
                  <Paragraph className='text-sm'>{formatAmount(sub?.apr)}%</Paragraph>
                </div>
                <div className='flex items-center gap-1'>
                  <TextHeading className='text-sm'>{t('TVL')}:</TextHeading>
                  <Paragraph className='text-sm'>${formatAmount(sub?.tvl)}</Paragraph>
                </div>
              </div>
            </div>

            <NeutralBadge>{isFarming ? 'Farm Strategy' : 'Fee Strategy'}</NeutralBadge>
          </div>
        ),
        strategy: strategyInfo,
        active: strategy?.address === sub?.address,
        onClickHandler: () => {
          setStrategy(strategyInfo)
        },
      }
    })

    return subPools ?? []
  }, [migrationOptions, strategy?.address, t])

  useEffect(() => {
    if (!strategy) {
      setStrategy(strategyData?.at(0)?.strategy)
    }
  }, [strategy, strategyData])

  const handleMigrate = () => {
    if (ICHI_TYPES.includes(positionV2?.title)) {
      migrateIchi({
        positionV2,
        strategy,
        callback: () => push('/dashboard'),
      })
    } else {
      migrateGamma({
        positionV2,
        strategy,
        callback: () => push('/dashboard'),
      })
    }
  }

  if (!positionV2) {
    return <Loading />
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
            <GaugeItem pool={positionV2} staked={staked} />
          </article>

          <span className='flex items-center justify-center'>
            <ArrowRightIcon className='mx-auto h-5 w-5 max-lg:rotate-90' />
          </span>

          <article className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2'>{t('Your New V3 Gauge')}</TextHeading>
            <GaugeItem pool={positionV2} strategy={strategy} />
          </article>
        </div>

        <div className='mt-[30px]'>
          <Selector data={strategyData} selected={strategy} setSelected={setStrategy} />
        </div>

        <Box className='mt-[30px] flex flex-row items-center justify-between gap-4 border border-primary-800 bg-primary-950'>
          <TextHeading className='text-neutral-100'>{t('During the migration all rewards will be')}</TextHeading>
        </Box>

        <div className='mt-6 flex flex-col justify-between gap-3 lg:flex-row'>
          <EmphasisButton className='w-full lg:w-[50%]' onClick={() => push('/dashboard')}>
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton onClick={handleMigrate} className='w-full lg:w-[50%]'>
            {t('Migrate Now')}
          </PrimaryButton>
        </div>
      </Box>
    </div>
  )
}
