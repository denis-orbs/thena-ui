'use client'

import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useContext, useMemo, useState } from 'react'
import { Pool, Position } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'
import { maxUint128 } from 'viem'
import { useReadContract, useReadContracts, useSimulateContract } from 'wagmi'

import Loading from '@/app/loading'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { algebraFactoryAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import { poolTestNetV2Abi } from '@/constant/v2-testnet-abi'
import { useAssets } from '@/context/assetsContext'
import { ManualsContext } from '@/context/manualsContext'
import { useCurrency, useToken } from '@/hooks/fusion/Tokens'
import { useAlgebraMigration } from '@/hooks/fusion/useAlgebra'
import useWallet from '@/hooks/useWallet'
import { getAlgebraNPMContract } from '@/lib/contracts'
import { unwrappedToken } from '@/lib/fusion'
import { warnToast } from '@/lib/notify'
import { AdjustNewPositionModal, GaugeItemManual } from '@/modules/Pools/Migration'
import { ArrowLeftIcon, ArrowNarrowUpRightIcon, ArrowRightIcon } from '@/svgs'

export function ManualMigrationPage({ tokenId }) {
  const t = useTranslations()
  const [isOpenAdjust, setIsOpenAdjust] = useState(false)

  // CALL APIs
  const assets = useAssets()
  const { mutateManual, positions } = useContext(ManualsContext)
  const { account, chainId } = useWallet()

  // GLOBAL STATE
  const { push } = useRouter()
  const { onAlgebraMigrate } = useAlgebraMigration()

  const existingPosition = useMemo(() => {
    if (tokenId) {
      return positions.find(ele => ele.tokenId === +tokenId && ele.version === 2)
    }
  }, [tokenId, positions])

  const { asset0, asset1, liquidity: posLiquidity, tickLower, tickUpper } = existingPosition

  const [firstAsset, secondAsset] = useMemo(
    () => [
      assets.find(item => item.address.toLowerCase() === asset0?.address.toLowerCase()),
      assets.find(item => item.address.toLowerCase() === asset1?.address.toLowerCase()),
    ],
    [asset0?.address, asset1?.address, assets],
  )

  const currencyA = useCurrency(firstAsset?.address)
  const currencyB = useCurrency(secondAsset?.address)

  const token0 = useToken(asset0.address)
  const token1 = useToken(asset1.address)

  const { data: poolAddresses } = useReadContracts({
    contracts: [
      {
        address: Contracts.algebraFactoryV2[chainId],
        abi: algebraFactoryAbi,
        functionName: 'computePoolAddress',
        args: [currencyA?.address, currencyB?.address],
      },
      {
        address: Contracts.algebraFactoryV3[chainId],
        abi: algebraFactoryAbi,
        functionName: 'computePoolAddress',
        args: [currencyA?.address, currencyB?.address],
      },
    ],
    query: {
      enabled: !!currencyA && !!currencyB,
    },
  })

  const poolAddressV2 = poolAddresses?.[0]?.result
  const poolAddressV3 = poolAddresses?.[1]?.result

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

  const { data: poolInfoV3 } = useReadContract({
    address: poolAddressV3,
    abi: poolTestNetV2Abi,
    functionName: 'liquidity',
    query: {
      enabled: !!poolAddressV3,
    },
  })

  const poolLiquidity = new BigNumber(poolInfoV2?.[0]?.result).toString(10)
  const globalStates = poolInfoV2?.[1]?.result
  const price = new BigNumber(globalStates?.[0]).toString(10)
  const tick = Number(globalStates?.[1])
  const fee = Number(globalStates?.[2])

  const positionV2 = useMemo(() => {
    if (asset0 && asset1 && fee && price && poolLiquidity && tick) {
      const pool = new Pool(currencyA, currencyB, fee, price, poolLiquidity, tick)

      return new Position({
        pool,
        liquidity: new BigNumber(posLiquidity).toString(10),
        tickLower,
        tickUpper,
      })
    }
  }, [asset0, asset1, currencyA, currencyB, fee, poolLiquidity, posLiquidity, price, tick, tickLower, tickUpper])

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

  // const feesInUsd = useMemo(
  //   () =>
  //     fromWei(fees ? fees[0] : 0, asset0.decimals)
  //       .times(asset0.price)
  //       .plus(fromWei(fees ? fees[1] : 0, asset1.decimals).times(asset1.price)),
  //   [fees, asset0, asset1],
  // )

  const isClaimable = useMemo(() => Number(fees?.[1]) + Number(fees?.[0]) > 0, [fees])

  const handleMigrate = (position = positionV2) => {
    onAlgebraMigrate({
      currencyA,
      amountA,
      currencyB,
      amountB,
      mintInfo: {
        position,
        idPoolExist: Boolean(poolInfoV3),
      },
      feeValue0,
      feeValue1,
      tokenId: existingPosition?.tokenId,
      isClaimable,
      callback: () => {
        // mutateFetchManualFee()
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

        <div className='mt-4 grid items-stretch gap-4 lg:grid-cols-[48%_2%_48%]'>
          <div className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2'>{t('Your Current Gauge')}</TextHeading>
            <GaugeItemManual existingPosition={existingPosition} position={positionV2} />
          </div>

          <div className='flex items-center justify-center'>
            <ArrowRightIcon className='mx-auto h-5 w-5 max-lg:rotate-90' />
          </div>

          <div className='flex h-full w-full flex-col'>
            <TextHeading className='mb-2'>{t('Your New V3 Gauge')}</TextHeading>
            <GaugeItemManual existingPosition={existingPosition} position={positionV2} version={3} />
          </div>
        </div>

        <Box className='mt-[30px] flex flex-row items-center justify-between gap-4 border border-primary-800 bg-primary-950'>
          <TextHeading className='text-neutral-100'>{t('During the migration all rewards will be')}</TextHeading>
        </Box>

        <div className='mt-6 flex flex-col justify-between gap-3 lg:flex-row'>
          <EmphasisButton className='w-full lg:w-[50%]'>{t('Cancel')}</EmphasisButton>
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
          console.log({ lower, upper, tickLower, tickUpper })

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
