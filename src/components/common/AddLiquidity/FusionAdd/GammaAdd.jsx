'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'
import { JSBI, WBNB } from 'thena-sdk-core'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Selection from '@/components/selection'
import { Paragraph, TextHeading } from '@/components/typography'
import { FusionRangeType } from '@/constant'
import { gammaHypervisorAbi } from '@/constant/abi/fusion'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useCurrencyBalance } from '@/hooks/fusion/useCurrencyBalances'
import { useAddGamma } from '@/hooks/fusion/useGamma'
import useWallet from '@/hooks/useWallet'
import { callMulti } from '@/lib/contractActions'
import { cn, formatAmount, unwrappedSymbol } from '@/lib/utils'
import PoolTitle from '@/modules/PoolTitle'
import { Field, updateSelectedPreset } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import { EnterAmounts } from './containers/EnterAmounts'

const feeAmount = 3000

export const fetchGammaInfo = async (chainId, strategy) => {
  const values = await callMulti([
    {
      address: strategy.address,
      abi: gammaHypervisorAbi,
      functionName: 'baseLower',
      args: [],
      chainId,
    },
    {
      address: strategy.address,
      abi: gammaHypervisorAbi,
      functionName: 'baseUpper',
      args: [],
      chainId,
    },
    {
      address: strategy.address,
      abi: gammaHypervisorAbi,
      functionName: 'currentTick',
      args: [],
      chainId,
    },
  ])
  const lowerValue = 1.0001 ** Number(values[0] - values[2])
  const upperValue = 1.0001 ** Number(values[1] - values[2])
  return {
    type: strategy.title,
    title: strategy.title,
    address: strategy.address,
    min: lowerValue,
    max: upperValue,
  }
}

export default function GammaAdd({ strategy, isModal, isAdd }) {
  const [isZapper, setIsZapper] = useState(false)
  const baseCurrency = useCurrency(strategy?.token0?.address)
  const quoteCurrency = useCurrency(strategy?.token1?.address)
  const { account } = useWallet()
  const { networkId } = useChainSettings()

  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, feeAmount, baseCurrency, undefined)
  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const amountA = mintInfo.parsedAmounts[Field.CURRENCY_A]
  const amountB = mintInfo.parsedAmounts[Field.CURRENCY_B]
  const wbnbBalance = useCurrencyBalance(WBNB[networkId])

  const { handleAddGamma, pending } = useAddGamma()
  const dispatch = useDispatch()

  const { data: preset } = useSWR(
    strategy && ['gamma/info', strategy.address],
    () => fetchGammaInfo(networkId, strategy),
    {
      refreshInterval: 0,
    },
  )
  const t = useTranslations()

  const addSelections = useMemo(
    () => [
      {
        label: 'Default',
        active: !isZapper,
        onClickHandler: () => {
          setIsZapper(false)
        },
      },
      {
        label: 'Zapper',
        active: isZapper,
        onClickHandler: () => {
          setIsZapper(true)
        },
      },
    ],
    [isZapper],
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
    handleAddGamma(amountA, amountB, amountToWrap, strategy)
  }, [amountA, amountB, amountToWrap, handleAddGamma, strategy])

  useEffect(() => {
    if (!price) return

    dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))

    onLeftRangeInput(preset ? String(+price * preset.min) : '')
    onRightRangeInput(preset ? String(+price * preset.max) : '')
    onChangePresetRange(preset)

    onChangeLiquidityRangeType(FusionRangeType.GAMMA_RANGE)
  }, [preset, dispatch, onChangePresetRange, onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType, price])

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        <div className='flex flex-col gap-5'>
          {isAdd && strategy && <PoolTitle strategy={strategy} />}

          <Selection data={addSelections} isFull />

          {isZapper ? (
            <div className='flex flex-col gap-5'>{t('Coming Soon')}</div>
          ) : (
            <div className='flex flex-col'>
              <EnterAmounts currencyA={baseCurrency} currencyB={quoteCurrency} mintInfo={mintInfo} />

              <div className='mt-5 flex flex-col gap-4'>
                <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
                <div className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>
                      {unwrappedSymbol(strategy?.token0)} {t('Amount')}
                    </Paragraph>
                    <Paragraph>{formatAmount(strategy?.token0?.reserve)}</Paragraph>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>
                      {unwrappedSymbol(strategy?.token1)} {t('Amount')}
                    </Paragraph>
                    <Paragraph>{formatAmount(strategy?.token1?.reserve)}</Paragraph>
                  </div>
                </div>
              </div>
              <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
                <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
                <div className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
                    <Paragraph>{formatAmount(strategy?.account?.totalLp)} LP</Paragraph>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
                    <Paragraph>{formatAmount(strategy?.account?.gaugeBalance)} LP</Paragraph>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isZapper && (
        <div
          className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row', isModal && 'px-3 lg:px-6')}
        >
          {account ? (
            <>
              <PrimaryButton
                disabled={pending}
                onClick={() => {
                  onAddLiquidity()
                }}
                className='w-full'
              >
                {t('Add Liquidity')}
              </PrimaryButton>
            </>
          ) : (
            <ConnectButton className='w-full' />
          )}
        </div>
      )}
    </>
  )
}
