'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Selector from '@/components/selector'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, PAIR_TYPES, POSITION_EARNED_TYPES } from '@/constant'
import { useVaults } from '@/context/vaultsContext'
import { useDefiedgeWithdraw } from '@/hooks/fusion/useDefiedge'
import { useGammaMigration, useGammaWithdraw } from '@/hooks/fusion/useGamma'
import { useIchiWithdraw, useMigrationIchi } from '@/hooks/fusion/useIchi'
import { useV1Migrate } from '@/hooks/useV1Liquidity'
import ArrowLeftIcon from '@/icons/ArrowLeftIcon'
import { GaugeItem } from '@/modules/Pools/Migration'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'
import { useGetAutoPoolMigration, usePairInfo, usePools } from '@/state/pools/hooks'
import { formatAmount, getDisplayedStrategy } from '@/utils/utils'

import NavigateToAddLiquidityModal from './NavigateToAddLiquidityModal'

export function AutoMigrationPage({ address, staked, withdraw }) {
  const [slippage, setSlippage] = useState(1)

  const t = useTranslations()
  const { push } = useRouter()
  const [strategy, setStrategy] = useState()
  const { migrateGamma } = useGammaMigration()
  const { migrateIchi } = useMigrationIchi()
  const { migrateV1 } = useV1Migrate()
  const { withdrawIchi } = useIchiWithdraw()
  const { withdrawGamma } = useGammaWithdraw()
  const { withdrawDefiedge } = useDefiedgeWithdraw()
  const [popup, setPopup] = useState(false)

  const pools = usePools()
  const vaults = useVaults()
  const userPools = useMemo(() => [...pools, ...vaults].filter(item => item.account.totalLp.gt(0)), [pools, vaults])

  const positionV2 = useMemo(() => {
    if (address) {
      return userPools.find(ele => ele?.address.toLowerCase() === address.toLowerCase() && ele.version === 2)
    }
  }, [address, userPools])

  const pairV3 = usePairInfo({
    token0Address: positionV2?.token0?.address,
    token1Address: positionV2?.token1?.address,
    type: PAIR_TYPES.LSD,
  })

  const strategyType = useMemo(() => {
    if (ICHI_TYPES.includes(positionV2?.title)) {
      return 'Ichi'
    }

    if (GAMMA_TYPES.includes(positionV2?.title)) {
      return 'Gamma'
    }

    if (positionV2?.title === 'DefiEdge') {
      return 'DefiEdge'
    }

    return 'V1'
  }, [positionV2?.title])

  const addLiqLink = useMemo(
    () =>
      `/pools/add-liquidity?firstAddress=${positionV2?.token0?.address}` +
      `&secondAddress=${positionV2?.token1?.address}` +
      '&pairType=Conc+Liquidity&step=2',
    [positionV2],
  )

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
                  <Paragraph className='text-sm'>{formatAmount(sub?.gauge?.apr)}%</Paragraph>
                </div>
                <div className='flex items-center gap-1'>
                  <TextHeading className='text-sm'>{t('TVL')}:</TextHeading>
                  <Paragraph className='text-sm'>${formatAmount(sub?.tvl)}</Paragraph>
                </div>
              </div>
            </div>

            {strategyType !== 'V1' && (
              <NeutralBadge>{isFarming ? POSITION_EARNED_TYPES.EARN_THE : POSITION_EARNED_TYPES.EARN_FEE}</NeutralBadge>
            )}
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
  }, [migrationOptions, strategyType, strategy?.address, t])

  useEffect(() => {
    if (!strategy) {
      setStrategy(strategyData?.at(0)?.strategy)
    }
  }, [strategy, strategyData])

  const handleMigrate = useCallback(() => {
    if (strategyType === 'Ichi') {
      migrateIchi({
        positionV2,
        strategy,
        callback: () => push('/dashboard'),
      })
    } else if (strategyType === 'Gamma') {
      migrateGamma({
        positionV2,
        strategy,
        slippage,
        callback: () => push('/dashboard'),
      })
    } else {
      migrateV1({
        positionV2,
        strategy,
        callback: () => push('/dashboard'),
      })
    }
  }, [strategyType, migrateIchi, positionV2, strategy, push, migrateGamma, slippage, migrateV1])

  const handleWithdraw = useCallback(() => {
    const callbackLink = pairV3
      ? `/pools/add-liquidity?step=3&poolAddress=${pairV3?.address}`
      : `/pools/add-liquidity?step=3&pairType=Conc+Liquidity&firstAddress=${positionV2?.token0?.address}` +
        `&secondAddress=${positionV2?.token1?.address}`

    if (ICHI_TYPES.includes(positionV2?.title)) {
      withdrawIchi({
        positionV2,
        callback: () => push(callbackLink),
      })
    } else if (positionV2?.title === 'DefiEdge') {
      withdrawDefiedge({
        positionV2,
        callback: () => push(callbackLink),
      })
    } else {
      withdrawGamma({
        positionV2,
        callback: () => push(callbackLink),
      })
    }
  }, [pairV3, positionV2, push, withdrawGamma, withdrawIchi, withdrawDefiedge])

  if (!positionV2) {
    return <Loading />
  }

  return (
    <div className='mx-auto max-w-5xl'>
      <Box className='rounded-xl bg-neutral-900 px-3 py-6 lg:px-7'>
        <div className='mb-10 flex flex-col gap-2'>
          <TextHeading className='font-archia text-3xl'>{t('Migration')}</TextHeading>
          {!withdraw && (
            <TextSubHeading className='text-base text-neutral-300'>{t('Migration description')}</TextSubHeading>
          )}
        </div>

        {strategyType === 'Gamma' && (
          <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} className='mb-4' />
        )}

        <div className='mt-4 grid items-stretch gap-4 lg:grid-cols-[48%_2%_48%]'>
          <article className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2 text-lg'>{t('Your Current Gauge')}</TextHeading>
            <GaugeItem pool={positionV2} staked={staked} />
          </article>

          {!withdraw && (
            <>
              <span className='flex items-center justify-center'>
                <ArrowLeftIcon className='mx-auto size-5 max-lg:-rotate-90' />
              </span>

              <article className='flex h-full w-full flex-col'>
                <TextHeading className='mb-2'>{t('Your New V3 Gauge')}</TextHeading>
                <GaugeItem pool={positionV2} strategy={strategy} strategyType={strategyType} staked={staked} />
              </article>
            </>
          )}
        </div>

        {!withdraw ? (
          <>
            <div className='mt-[30px]'>
              <Selector data={strategyData} selected={strategy} setSelected={setStrategy} />
            </div>

            <Box className='border-primary-800 bg-primary-950 mt-[30px] flex flex-row items-center justify-between gap-4 border'>
              <TextHeading className='text-neutral-100'>{t('During the migration all rewards will be')}</TextHeading>
            </Box>
          </>
        ) : (
          <Box className='border-primary-800 bg-primary-950 mt-[30px] flex flex-row items-center justify-between gap-4 border'>
            <TextHeading className='text-neutral-100'>
              {`${strategyType} ${t('withdraw and deposit manually warning')}`}
            </TextHeading>
          </Box>
        )}

        <div className='mt-6 flex flex-col justify-between gap-3 lg:flex-row'>
          <EmphasisButton className='w-full lg:w-[50%]' onClick={() => push('/dashboard')}>
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton onClick={withdraw ? handleWithdraw : handleMigrate} className='w-full lg:w-[50%]'>
            {t(withdraw ? 'Withdraw' : 'Migrate Now')}
          </PrimaryButton>
        </div>
      </Box>

      <NavigateToAddLiquidityModal popup={popup} setPopup={setPopup} link={addLiqLink} />
    </div>
  )
}
