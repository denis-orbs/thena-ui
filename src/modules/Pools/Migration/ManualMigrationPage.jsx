'use client'

import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Pool, Position } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'
import { maxUint128, zeroAddress } from 'viem'
import { useReadContracts, useSimulateContract } from 'wagmi'

import Loading from '@/app/loading'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import Selector from '@/components/selector'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { MANUAL_TYPES } from '@/constant'
import { poolTestNetV2Abi } from '@/constant/v2-testnet-abi'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import { ManualsContext } from '@/context/manualsContext'
import { usePairs } from '@/context/pairsContext'
import { useCurrency, useToken } from '@/hooks/fusion/Tokens'
import { useAlgebraMigration } from '@/hooks/fusion/useAlgebra'
import { PoolState, useFusionState } from '@/hooks/fusion/useFusions'
import { usePoolAlgebraInfo } from '@/hooks/fusion/usePoolAlgebraInfo'
import usePrevious from '@/hooks/usePrevious'
import useWallet from '@/hooks/useWallet'
import { getAlgebraNPMContract } from '@/lib/contracts'
import { unwrappedToken } from '@/lib/fusion'
import { getTokenInfo } from '@/lib/helper'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount } from '@/lib/utils'
import { AdjustNewPositionModal, GaugeItemManual } from '@/modules/Pools/Migration'
import { ArrowLeftIcon, ArrowNarrowUpRightIcon, ArrowRightIcon } from '@/svgs'

export function ManualMigrationPage({ tokenId }) {
  const t = useTranslations()

  // CALL APIs
  const assets = useAssets()
  const customAssets = useCustomAssets()
  const { mutateManual, positions } = useContext(ManualsContext)
  const { account, chainId } = useWallet()

  // GLOBAL STATE
  const { push } = useRouter()
  const { onAlgebraMigrate } = useAlgebraMigration()

  // LOCAL STATE
  const [isOpenAdjust, setIsOpenAdjust] = useState(false)
  const [strategy, setStrategy] = useState()

  const existingPosition = useMemo(() => {
    if (tokenId) {
      return positions.find(ele => ele.tokenId === +tokenId && ele.version === 2)
    }
  }, [tokenId, positions])
  const { asset0, asset1, liquidity: posLiquidity, tickLower, tickUpper } = existingPosition

  const [firstAsset, secondAsset] = useMemo(
    () => [
      getTokenInfo({ tokenAddress: asset0?.address, assets, customAssets }),
      getTokenInfo({ tokenAddress: asset1?.address, assets, customAssets }),
    ],
    [asset0?.address, asset1?.address, assets, customAssets],
  )

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
        let { title } = sub
        let isFarming = false
        let badge = '80% Fees'
        if (title === 'CL_SwapFee') title = 'Manual (Swap Fees)'

        if (title === 'CL_Farming') {
          title = 'Manual ($THE Emissions)'
          isFarming = true
          badge = '$THE + 10% Fees'
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
                <TextHeading>{title}</TextHeading>
                <div className='mt-1 flex gap-2'>
                  <div className='flex items-center gap-1'>
                    <TextHeading className='text-sm'>{t('APR')}:</TextHeading>
                    <Paragraph className='text-sm'>{formatAmount(sub?.gauge?.apr)}%</Paragraph>
                  </div>
                  <div className='flex items-center gap-1'>
                    <TextHeading className='text-sm'>{t('TVL')}:</TextHeading>
                    <Paragraph className='text-sm'>${formatAmount(sub?.gauge?.tvl)}</Paragraph>
                  </div>
                </div>
              </div>

              <NeutralBadge>{badge}</NeutralBadge>
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

  const [fusionStateV2, fusionV2, poolAddressV2] = useFusionState({ currencyA, currencyB, version: 2 })
  const [fusionStateV3, fusionV3] = useFusionState({ currencyA, currencyB, version: 3 })

  const contractV2 = { address: poolAddressV2, abi: poolTestNetV2Abi }
  const { data: poolInfoV2 } = useReadContracts({
    contracts: [
      { ...contractV2, functionName: 'liquidity' },
      { ...contractV2, functionName: 'globalState' },
    ],
    query: {
      enabled: !!poolAddressV2,
    },
  })

  const poolLiquidity = new BigNumber(poolInfoV2?.[0]?.result).toString(10)
  const globalStates = poolInfoV2?.[1]?.result
  const price = new BigNumber(globalStates?.[0]).toString(10)
  const tick = Number(globalStates?.[1])
  const fee = Number(globalStates?.[2])

  const [prevFusionState, prevFusion] = usePrevious([fusionStateV2, fusionV2]) || []
  const [, _fusion] = useMemo(() => {
    if (!fusionV2 && prevFusion && prevFusionState) {
      return [prevFusionState, prevFusion]
    }
    return [fusionStateV2, fusionV2]
  }, [fusionV2, fusionStateV2, prevFusion, prevFusionState])

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

  const amountA = useMemo(() => positionV2?.amount0?.toExact() ?? 0, [positionV2])
  const amountB = useMemo(() => positionV2?.amount1?.toExact() ?? 0, [positionV2])

  const algebraContract = getAlgebraNPMContract(chainId)
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

  const token0 = useToken(asset0.address)
  const token1 = useToken(asset1.address)
  const feeValue0 = useMemo(
    () => CurrencyAmount.fromRawAmount(unwrappedToken(token0), new BigNumber(fees?.result?.[0] ?? 0).toString(10)),
    [token0, fees],
  )
  const feeValue1 = useMemo(
    () => CurrencyAmount.fromRawAmount(unwrappedToken(token1), new BigNumber(fees?.result?.[1] ?? 0).toString(10)),
    [token1, fees],
  )

  const tickCurrent = positionV2?.pool?.tickCurrent
  const outOfRange = tickCurrent < tickLower || tickCurrent >= tickUpper

  const handleMigrate = (position = positionV2) => {
    onAlgebraMigrate({
      currencyA,
      amountA,
      currencyB,
      amountB,
      mintInfo: {
        position,
        isPoolExist: Boolean(fusionStateV3 === PoolState.EXISTS),
      },
      feeValue0,
      feeValue1,
      tokenId: existingPosition?.tokenId,
      isFarming: strategy.isFarming,
      callback: () => {
        mutateManual()
        push('/dashboard')
      },
    })
  }

  const onSubmit = () => {
    if (!existingPosition?.tokenId) {
      warnToast('you not own this position')
    }

    if (outOfRange) {
      setIsOpenAdjust(true)
    } else {
      // setIsOpenAdjust(true)
      handleMigrate()
    }
  }

  if (!existingPosition) {
    return <Loading />
  }

  return (
    <div className='mx-auto flex flex-col justify-center lg:flex-row'>
      <div className='h-11 w-[98px]'>
        <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/dashboard')}>
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

        <div className='my-4 flex flex-col gap-4 md:flex-row'>
          <div className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2'>{t('Your Current Gauge')}</TextHeading>
            <GaugeItemManual existingPosition={existingPosition} position={positionV2} fusion={fusionV2} />
          </div>

          <div className='flex items-center justify-center'>
            <ArrowRightIcon className='mx-auto h-5 w-5 max-lg:rotate-90' />
          </div>

          <div className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2'>{t('Your New V3 Gauge')}</TextHeading>
            <GaugeItemManual existingPosition={existingPosition} position={positionV2} fusion={fusionV3} version={3} />
          </div>
        </div>

        <div className={cn(incentiveAddress === zeroAddress && 'hidden')}>
          <Selector data={strategyData} selected={strategy} setSelected={setStrategy} />
        </div>

        <Box className='mt-[30px] flex flex-row items-center justify-between gap-4 border border-primary-800 bg-primary-950'>
          <TextHeading className='text-neutral-100'>{t('During the migration all rewards will be')}</TextHeading>
        </Box>

        <div className='mt-6 flex flex-col justify-between gap-3 lg:flex-row'>
          <EmphasisButton onClick={() => push('/dashboard')} className='w-full lg:w-[50%]'>
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton className='w-full lg:w-[50%]' onClick={onSubmit}>
            {t('Migrate Now')}
          </PrimaryButton>
        </div>
      </Box>

      <AdjustNewPositionModal
        firstAddress={asset0?.address}
        secondAddress={asset1?.address}
        existingPosition={existingPosition}
        feeAmount={fee}
        isOpen={isOpenAdjust}
        onClose={() => setIsOpenAdjust(false)}
        onAdjustRange={(lower, upper) => {
          if (asset0 && asset1 && fee && price && poolLiquidity && tick) {
            const position = new Position({
              pool: new Pool(currencyA, currencyB, fee, price, poolLiquidity, tick),
              liquidity: new BigNumber(posLiquidity).toString(10),
              tickLower: lower,
              tickUpper: upper,
            })

            handleMigrate(position)
          }
        }}
      />
    </div>
  )
}
