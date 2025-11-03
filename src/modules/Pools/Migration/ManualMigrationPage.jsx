'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CurrencyAmount } from 'thena-sdk-core'
import { Position } from 'thenafi-fusion-sdk'
import { maxUint128, zeroAddress } from 'viem'
import { useSimulateContract } from 'wagmi'

import Loading from '@/app/loading'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Selector from '@/components/selector'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { MANUAL_TYPES, POSITION_EARNED_TYPES } from '@/constant'
import { ManualsContext } from '@/context/manualsContext'
import { usePairs } from '@/context/pairsContext'
import { useCurrency, useGetAsset, useToken } from '@/hooks/fusion/Tokens'
import { useAlgebraMigration, useAlgebraRemoveAll } from '@/hooks/fusion/useAlgebra'
import { PoolState, useFusionState } from '@/hooks/fusion/useFusions'
import { usePoolAlgebraInfo } from '@/hooks/fusion/usePoolAlgebraInfo'
import usePrevious from '@/hooks/usePrevious'
import useWallet from '@/hooks/useWallet'
import ArrowLeftIcon from '@/icons/ArrowLeftIcon'
import { getPositionManagerContract } from '@/lib/contracts'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, getDisplayedStrategy, toWei } from '@/lib/utils'
import { GaugeItemManual } from '@/modules/Pools/Migration'

export function ManualMigrationPage({ tokenId }) {
  const t = useTranslations()

  // CALL APIs
  const { mutateManual, positions } = useContext(ManualsContext)
  const { account, chainId = 56 } = useWallet()

  // GLOBAL STATE
  const { push } = useRouter()
  const { onAlgebraMigrate } = useAlgebraMigration()
  const { onAlgebraRemoveAll } = useAlgebraRemoveAll()

  // LOCAL STATE
  const [strategy, setStrategy] = useState()

  const existingPosition = useMemo(() => {
    if (tokenId) {
      return positions.find(ele => ele.tokenId === +tokenId && ele.version === 2)
    }
  }, [tokenId, positions])
  const { asset0, asset1, liquidity: posLiquidity, tickLower, tickUpper } = existingPosition ?? {}

  const firstAsset = useGetAsset(asset0?.address)
  const secondAsset = useGetAsset(asset1?.address)

  const currencyA = useCurrency(firstAsset?.address)
  const currencyB = useCurrency(secondAsset?.address)
  const { incentiveAddress, poolAddress } = usePoolAlgebraInfo(firstAsset?.address, secondAsset?.address)

  const { pairs } = usePairs()
  const pool = useMemo(
    () => pairs.find(ele => ele?.address.toLowerCase() === poolAddress?.toLowerCase()),
    [poolAddress, pairs],
  )

  const strategyData = useMemo(() => {
    const subPools = pool?.subpools
      ?.filter(sub => MANUAL_TYPES.includes(sub.title))
      .map(sub => {
        let isFarming = false
        if (sub.title.includes('Farming')) {
          isFarming = true
        }

        const strategyInfo = {
          ...sub,
          type: 'manual',
          isFarming,
        }

        return {
          content: (
            <div className='flex flex-1 items-center justify-between'>
              <div>
                <TextHeading>{getDisplayedStrategy(sub.title)}</TextHeading>
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

              <NeutralBadge>{isFarming ? POSITION_EARNED_TYPES.EARN_THE : POSITION_EARNED_TYPES.EARN_FEE}</NeutralBadge>
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
  }, [pool?.subpools, strategy?.address, t])

  useEffect(() => {
    if (!strategy) {
      setStrategy(strategyData?.at(0)?.strategy)
    }
  }, [strategy, strategyData])

  const [fusionStateV2, poolV2, _addressV2, tickSpacingV2] = useFusionState({ currencyA, currencyB, version: 2 })
  const [fusionStateV3, poolV3, _addressV3, tickSpacingV3] = useFusionState({
    currencyA,
    currencyB,
    version: 3,
    isFarmingPool: strategy?.isFarming,
  })
  const isPoolV3Exist = Boolean(fusionStateV3 === PoolState.EXISTS)

  const [prevFusionState, prevFusion] = usePrevious([fusionStateV2, poolV2]) || []
  const [, _fusion] = useMemo(() => {
    if (!poolV2 && prevFusion && prevFusionState) {
      return [prevFusionState, prevFusion]
    }
    return [fusionStateV2, poolV2]
  }, [poolV2, fusionStateV2, prevFusion, prevFusionState])

  const positionV2 = useMemo(() => {
    if (_fusion) {
      return new Position({
        pool: _fusion,
        liquidity: new BigNumber(posLiquidity).toString(10),
        tickLower,
        tickUpper,
      })
    }
    return undefined
  }, [_fusion, posLiquidity, tickLower, tickUpper])

  const amountA = useMemo(() => positionV2?.amount0?.toExact() ?? '0', [positionV2])
  const amountB = useMemo(() => positionV2?.amount1?.toExact() ?? '0', [positionV2])

  const positionV3 = useMemo(() => {
    if (poolV3 && tickUpper && tickLower) {
      const amount0 = toWei(
        BigNumber(amountA)
          .decimalPlaces(currencyA?.decimals ?? 18, BigNumber.ROUND_DOWN)
          .toString(),
        currencyA?.decimals ?? 18,
      )
      const amount1 = toWei(
        BigNumber(amountB)
          .decimalPlaces(currencyB?.decimals ?? 18, BigNumber.ROUND_DOWN)
          .toString(),
        currencyB?.decimals ?? 18,
      )

      return Position.fromAmounts({
        pool: poolV3,
        tickLower,
        tickUpper,
        amount0,
        amount1,
      })
    }
    return undefined
  }, [amountA, amountB, currencyA?.decimals, currencyB?.decimals, poolV3, tickLower, tickUpper])

  const algebraContract = getPositionManagerContract(chainId, 2)
  const { data: fees } = useSimulateContract({
    address: algebraContract.address,
    abi: algebraContract.abi,
    functionName: 'collect',
    args: [
      {
        tokenId,
        recipient: account,
        amount0Max: maxUint128,
        amount1Max: maxUint128,
      },
    ],
    query: {
      enabled: !!account,
    },
  })

  const token0 = useToken(asset0?.address)
  const token1 = useToken(asset1?.address)
  const feeValue0 = useMemo(() => {
    if (token0 && fees) {
      return CurrencyAmount.fromRawAmount(token0, new BigNumber(fees?.result?.[0] ?? 0).toString(10))
    }
  }, [token0, fees])
  const feeValue1 = useMemo(() => {
    if (token1 && fees) {
      return CurrencyAmount.fromRawAmount(token1, new BigNumber(fees?.result?.[1] ?? 0).toString(10))
    }
  }, [token1, fees])

  const tickCurrent = positionV2?.pool?.tickCurrent
  const outOfRange = tickCurrent < tickLower || tickCurrent >= tickUpper

  const onSubmit = useCallback(() => {
    if (!existingPosition?.tokenId) {
      warnToast('you not own this position')
    }

    // MARK: when out of range or not exist pool,
    // Just remove liquidity from v2 and redirect to add liquidity page
    if (outOfRange || !isPoolV3Exist) {
      onAlgebraRemoveAll({
        position: positionV2,
        currencyA,
        currencyB,
        feeValue0,
        feeValue1,
        tokenId,
      })
      return
    }

    onAlgebraMigrate({
      positionV2,
      currencyA,
      currencyB,
      amountA,
      amountB,
      mintInfo: {
        positionV3,
        isPoolExist: isPoolV3Exist,
      },
      feeValue0,
      feeValue1,
      tokenId: existingPosition?.tokenId,
      isFarming: strategy?.isFarming,
      callback: () => {
        push('/dashboard')
        mutateManual()
      },
    })
  }, [
    amountA,
    amountB,
    currencyA,
    currencyB,
    existingPosition?.tokenId,
    feeValue0,
    feeValue1,
    isPoolV3Exist,
    mutateManual,
    onAlgebraMigrate,
    onAlgebraRemoveAll,
    outOfRange,
    positionV2,
    positionV3,
    push,
    strategy?.isFarming,
    tokenId,
  ])

  if (!existingPosition) {
    return <Loading />
  }

  return (
    <div className='mx-auto max-w-5xl'>
      {/* <div className='h-11 w-[98px]'>
        <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/dashboard')}>
          {t('Back')}
        </TextButton>
      </div> */}

      <Box className='rounded-xl bg-neutral-900 px-3 py-6 lg:px-7'>
        <div className='mb-10 flex flex-col gap-2'>
          <TextHeading className='font-archia text-3xl'>{t('Migration')}</TextHeading>
          <TextSubHeading className='text-base text-neutral-300'>{t('Migration description')}&nbsp;</TextSubHeading>
        </div>

        <div className='my-4 flex flex-col gap-4 md:flex-row'>
          <div className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2'>{t('Your Current Gauge')}</TextHeading>
            <GaugeItemManual
              existingPosition={existingPosition}
              position={positionV2}
              fusion={poolV2}
              tickSpacing={tickSpacingV2}
            />
          </div>

          <div className='flex items-center justify-center'>
            <ArrowLeftIcon className='mx-auto size-5 -rotate-90 md:rotate-180' />
          </div>

          <div className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2'>{t('Your New V3 Gauge')}</TextHeading>
            <GaugeItemManual
              existingPosition={existingPosition}
              position={positionV3}
              fusion={poolV3}
              version={3}
              tickSpacing={tickSpacingV3}
            />
          </div>
        </div>

        <div className={cn(incentiveAddress === zeroAddress && 'hidden')}>
          <Selector data={strategyData} selected={strategy} setSelected={setStrategy} />
        </div>

        <Box className='border-primary-800 bg-primary-950 mt-[30px] flex flex-row items-center justify-between gap-4 border'>
          <TextHeading className='text-neutral-100'>{t('During the migration all rewards will be')}</TextHeading>
        </Box>

        <div className='mt-6 flex flex-col justify-between gap-3 lg:flex-row'>
          <EmphasisButton onClick={() => push('/dashboard')} className='w-full lg:w-[50%]'>
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton className='w-full lg:w-[50%]' onClick={onSubmit}>
            {isPoolV3Exist ? t('Migrate Now') : t('Migrate & create Pool')}
          </PrimaryButton>
        </div>
      </Box>
    </div>
  )
}
