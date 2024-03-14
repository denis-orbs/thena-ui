'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { JSBI, WBNB } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { Paragraph, TextHeading } from '@/components/typography'
import { FusionRangeType } from '@/constant'
import { useFusionPairs } from '@/context/fusionsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useCurrencyBalance } from '@/hooks/fusion/useCurrencyBalances'
import { useDefiedgeAdd, useDefiedgeAddAndStake } from '@/hooks/fusion/useDefiedge'
import { readCall } from '@/lib/contractActions'
import { getDefiedgeStrategyContract } from '@/lib/contracts'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, unwrappedSymbol } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import PoolTitle from '@/modules/PoolTitle'
import { Field, updateSelectedPreset } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import { EnterAmounts } from './containers/EnterAmounts'

const feeAmount = 3000

export const fetchDefiedgeInfo = async (chainId, strategy, currentTick) => {
  const contract = getDefiedgeStrategyContract(strategy.address, chainId)
  const res = await readCall(contract, 'getTicks', [], chainId)
  const lowerValue = 1.0001 ** (Number(res[0].tickLower) - currentTick)
  const upperValue = 1.0001 ** (Number(res[0].tickUpper) - currentTick)
  return {
    type: strategy.title,
    title: strategy.title,
    address: strategy.address,
    min: lowerValue,
    max: upperValue,
  }
}

const fetchDefiedgePair = async (chainId, strategy) => {
  const contract = getDefiedgeStrategyContract(strategy.address, chainId)
  const res = await readCall(contract, 'pool', [], chainId)
  return res
}

export default function DefiedgeAdd({ strategy, isModal, isAdd }) {
  const fusionPairs = useFusionPairs()
  const baseCurrency = useCurrency(strategy.token0.address)
  const quoteCurrency = useCurrency(strategy.token1.address)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)
  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)
  const { errorMessage } = mintInfo
  const amountA = mintInfo.parsedAmounts[Field.CURRENCY_A]
  const amountB = mintInfo.parsedAmounts[Field.CURRENCY_B]
  const wbnbBalance = useCurrencyBalance(WBNB[networkId])
  const { onDefiedgeAdd, pending } = useDefiedgeAdd()
  const { onDefiedgeAddAndStake, pendingStake } = useDefiedgeAddAndStake()
  const dispatch = useDispatch()
  const { data: pairAddress } = useSWR(
    strategy && ['defiedge/pair', strategy.address],
    () => fetchDefiedgePair(networkId, strategy),
    {
      refreshInterval: 0,
    },
  )
  const pair = useMemo(
    () => fusionPairs.find(ele => pairAddress && pairAddress.toLowerCase() === ele.address),
    [fusionPairs, pairAddress],
  )
  const { data: preset } = useSWR(
    strategy && pair && ['defiedge/info', strategy.address],
    () => fetchDefiedgeInfo(networkId, strategy, pair.globalState.tick),
    {
      refreshInterval: 0,
    },
  )

  const price = useMemo(() => {
    if (!mintInfo.price) return

    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo])

  const amountToWrap = useMemo(() => {
    if (!baseCurrency || !quoteCurrency || !amountA || !amountB) return
    if (baseCurrency.isNative || baseCurrency.wrapped.address.toLowerCase() === WBNB[networkId].address.toLowerCase()) {
      if (wbnbBalance && JSBI.greaterThan(amountA.numerator, wbnbBalance.numerator)) {
        return JSBI.subtract(amountA.numerator, wbnbBalance.numerator)
      }
    } else if (
      quoteCurrency.isNative ||
      quoteCurrency.wrapped.address.toLowerCase() === WBNB[networkId].address.toLowerCase()
    ) {
      if (wbnbBalance && JSBI.greaterThan(amountB.numerator, wbnbBalance.numerator)) {
        return JSBI.subtract(amountB.numerator, wbnbBalance.numerator)
      }
    }
  }, [amountA, amountB, baseCurrency, quoteCurrency, wbnbBalance, networkId])

  const onAddLiquidity = useCallback(() => {
    if (errorMessage) {
      warnToast(errorMessage, 'warn')
      return
    }

    onDefiedgeAdd(amountA, amountB, amountToWrap, strategy)
  }, [errorMessage, strategy, amountToWrap, amountA, amountB, onDefiedgeAdd])

  const onAddLiquidityAndStake = useCallback(() => {
    if (errorMessage) {
      warnToast(errorMessage, 'warn')
      return
    }
    onDefiedgeAddAndStake(amountA, amountB, amountToWrap, strategy)
  }, [errorMessage, amountToWrap, onDefiedgeAddAndStake, amountA, amountB, strategy])

  useEffect(() => {
    if (!price || !preset) return

    dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))

    onLeftRangeInput(preset ? String(+price * preset.min) : '')
    onRightRangeInput(preset ? String(+price * preset.max) : '')
    onChangePresetRange(preset)

    onChangeLiquidityRangeType(FusionRangeType.DEFIEDGE_RANGE)
  }, [
    fusionPairs,
    preset,
    dispatch,
    onChangePresetRange,
    onLeftRangeInput,
    onRightRangeInput,
    onChangeLiquidityRangeType,
    price,
  ])

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        <div className='flex flex-col gap-5'>
          {isAdd && strategy && <PoolTitle strategy={strategy} />}
          <div className='flex flex-col'>
            <EnterAmounts currencyA={baseCurrency} currencyB={quoteCurrency} mintInfo={mintInfo} />
            <div className='mt-5 flex flex-col gap-4'>
              <TextHeading className='text-lg'>Reserve Info</TextHeading>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>{unwrappedSymbol(strategy.token0)} Amount</Paragraph>
                  <Paragraph>{formatAmount(strategy.token0.reserve)}</Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>{unwrappedSymbol(strategy.token1)} Amount</Paragraph>
                  <Paragraph>{formatAmount(strategy.token1.reserve)}</Paragraph>
                </div>
              </div>
            </div>
            <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
              <TextHeading className='text-lg'>My Info</TextHeading>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>Pooled Liquidity</Paragraph>
                  <Paragraph>{formatAmount(strategy.account.totalLp)} LP</Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>Staked Liquidity</Paragraph>
                  <Paragraph>{formatAmount(strategy.account.gaugeBalance)} LP</Paragraph>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row', isModal && 'px-3 lg:px-6')}
      >
        {account ? (
          <>
            <SecondaryButton
              disabled={pending}
              onClick={() => {
                onAddLiquidity()
              }}
              className='w-full'
            >
              Add Liquidity
            </SecondaryButton>
            {strategy && strategy.gauge.address !== zeroAddress && (
              <PrimaryButton
                disabled={pendingStake}
                onClick={() => {
                  onAddLiquidityAndStake()
                }}
                className='w-full'
              >
                Add Liquidity & Stake
              </PrimaryButton>
            )}
          </>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </>
  )
}
