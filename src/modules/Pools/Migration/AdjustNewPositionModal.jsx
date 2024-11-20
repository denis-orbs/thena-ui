import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'

import { Warning } from '@/components/alert'
import { EmphasisButton } from '@/components/buttons/Button'
import { PresetRanges } from '@/components/common/AddLiquidity/components/PresetRange'
import { RangeSelector } from '@/components/common/AddLiquidity/components/RangeSelector'
import LiquidityChartRangeInput from '@/components/common/AddLiquidity/FusionAdd/LiquidityChartRangeInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import Selection from '@/components/selection'
import Spinner from '@/components/spinner'
import Tabs from '@/components/tabs'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useCurrency, useStableTokens } from '@/hooks/fusion/Tokens'
import { PoolState } from '@/hooks/fusion/useFusions'
import { formatAmount, unwrappedSymbol } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'
import {
  useActivePreset,
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
} from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'

const firstAsset = {
  name: 'THENA',
  symbol: 'THE',
  price: 0.2346,
  decimals: 18,
  chainId: 56,
  address: '0xf4c8e32eadec4bfe97e0f595add0f4450a863a11',
  logoURI: 'https://cdn.thena.fi/assets/THE.png',
  balance: '125.756684206505201267',
}

const secondAsset = {
  address: 'BNB',
  name: 'Binance Coin',
  symbol: 'BNB',
  decimals: 18,
  logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
  price: 594.76,
  chainId: 56,
  balance: '0.035541523775499454',
}

const feeAmount = 3000

export function AdjustNewPositionModal({ isOpen, onClose }) {
  const [isReverse, setIsReverse] = useState(false)
  const [fullRangeWarningShown, setFullRangeWarningShown] = useState(true)
  const t = useTranslations()

  // TODO: mock data
  const balanceString = '10'

  const currencyA = useCurrency(firstAsset ? firstAsset.address : undefined)
  const currencyB = useCurrency(secondAsset ? secondAsset.address : undefined)
  const stableAssets = useStableTokens()
  const baseCurrency = useMemo(() => (isReverse ? currencyB : currencyA), [currencyA, currencyB, isReverse])
  const quoteCurrency = useMemo(() => (isReverse ? currencyA : currencyB), [currencyA, currencyB, isReverse])

  const mintInfo = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    undefined,
  )

  const { ticksAtLimit, invertPrice } = mintInfo

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])

  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(
      baseCurrency ?? undefined,
      quoteCurrency ?? undefined,
      mintInfo.dynamicFee,
      tickLower,
      tickUpper,
      mintInfo.pool,
    )

  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput } = useV3MintActionHandlers(
    mintInfo.noLiquidity,
  )

  const activePreset = useActivePreset()
  const isStablecoinPair = useMemo(() => {
    const stablecoins = stableAssets.map(token => token.address)
    return stablecoins.includes(baseCurrency?.wrapped?.address) && stablecoins.includes(quoteCurrency?.wrapped?.address)
  }, [baseCurrency, quoteCurrency, stableAssets])

  const price = useMemo(() => {
    if (!mintInfo?.price) return

    return mintInfo?.invertPrice ? mintInfo?.price.invert().toSignificant(5) : mintInfo?.price.toSignificant(5)
  }, [mintInfo])

  const leftPrice = useMemo(
    () => (baseCurrency?.wrapped.sortsBefore(quoteCurrency?.wrapped) ? priceLower : priceUpper?.invert()),
    [baseCurrency, quoteCurrency, priceLower, priceUpper],
  )

  const rightPrice = useMemo(
    () => (baseCurrency?.wrapped?.sortsBefore(quoteCurrency.wrapped) ? priceUpper : priceLower?.invert()),
    [baseCurrency, quoteCurrency, priceLower, priceUpper],
  )

  const currentPrice = useMemo(() => {
    if (!mintInfo.price) return

    const _price = mintInfo.invertPrice
      ? parseFloat(mintInfo.price.invert().toSignificant(5))
      : parseFloat(mintInfo.price.toSignificant(5))

    if (Number(_price) <= 0.0001) {
      return '< 0.0001'
    }
    return `${_price}`
  }, [mintInfo.price, mintInfo.invertPrice])

  const feeString = useMemo(() => {
    if (mintInfo.poolState === PoolState.INVALID || mintInfo.poolState === PoolState.LOADING) return <Spinner />

    if (mintInfo.noLiquidity) return '0.3%'

    return `${mintInfo.dynamicFee / 10000}%`
  }, [mintInfo])

  const risk = useMemo(() => {
    const upPrice = rightPrice?.toSignificant(5)
    const downPrice = leftPrice?.toSignificant(5)
    if (!upPrice || !downPrice || !price) return

    const upperPercent = 100 - (+price / +upPrice) * 100
    const lowerPercent = Math.abs(100 - (+price / +downPrice) * 100)

    const rangePercent = +downPrice > +price && +upPrice > 0 ? upperPercent - lowerPercent : upperPercent + lowerPercent

    if (rangePercent < 7.5) {
      return 5
    }
    if (rangePercent < 15) {
      return (15 - rangePercent) / 7.5 + 4
    }
    if (rangePercent < 30) {
      return (30 - rangePercent) / 15 + 3
    }
    if (rangePercent < 60) {
      return (60 - rangePercent) / 30 + 2
    }
    if (rangePercent < 120) {
      return (120 - rangePercent) / 60 + 1
    }
    return 1
  }, [price, rightPrice, leftPrice])

  const _risk = useMemo(() => {
    const res = []
    const split = risk?.toString().split('.')

    if (!split) return

    for (let i = 0; i < 10; i++) {
      if (i < +split[0]) {
        res.push(100)
      } else if (i === +split[0]) {
        res.push(parseFloat(`0.${split[1]}`) * 100)
      } else {
        res.push(0)
      }
    }

    return res
  }, [risk])

  const [tokenAmount, setTokenAmount] = useState()

  const handleInput = useCallback(value => {
    setTokenAmount(value)
  }, [])

  const PriceRangData = useMemo(
    () => [
      {
        label: unwrappedSymbol(firstAsset),
        active: !isReverse,
        onClickHandler: () => {
          setIsReverse(false)
          if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
            onLeftRangeInput((invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
            onRightRangeInput((invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
          }
          onFieldAInput('')
          onFieldBInput('')
        },
      },
      {
        label: unwrappedSymbol(secondAsset),
        active: isReverse,
        onClickHandler: () => {
          setIsReverse(true)
          if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
            onLeftRangeInput((invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
            onRightRangeInput((invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
          }
          onFieldAInput('')
          onFieldBInput('')
        },
      },
    ],
    [
      invertPrice,
      isReverse,
      onFieldAInput,
      onFieldBInput,
      onLeftRangeInput,
      onRightRangeInput,
      priceLower,
      priceUpper,
      ticksAtLimit,
    ],
  )

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => {},
      },
      {
        label: '25%',
        onClickHandler: () => {},
      },
      {
        label: '50%',
        onClickHandler: () => {},
      },
      {
        label: 'Max',
        onClickHandler: () => {},
      },
    ],
    [],
  )

  const handlePresetRangeSelection = useCallback(
    preset => {
      if (!price) return
      // dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))
      if (preset && preset.type === Presets.FULL) {
        setFullRangeWarningShown(true)
        getSetFullRange()
      } else {
        setFullRangeWarningShown(false)
        onLeftRangeInput(preset ? String(+price * preset.min) : '')
        onRightRangeInput(preset ? String(+price * preset.max) : '')
      }
    },
    [getSetFullRange, onLeftRangeInput, onRightRangeInput, price],
  )

  return (
    <Modal width={540} isOpen={isOpen} closeModal={onClose} title={t('Adjust New Position')}>
      <ModalBody className='flex flex-col gap-5'>
        <div className='flex flex-col gap-3'>
          <PresetRanges
            mintInfo={mintInfo}
            isStablecoinPair={isStablecoinPair}
            activePreset={activePreset}
            handlePresetRangeSelection={handlePresetRangeSelection}
          />
        </div>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-row items-center justify-between'>
            <TextHeading>{t('Price Range')}</TextHeading>
            <Selection data={PriceRangData} isSmall />
          </div>
          <RangeSelector
            priceLower={priceLower}
            priceUpper={priceUpper}
            getDecrementLower={getDecrementLower}
            getIncrementLower={getIncrementLower}
            getDecrementUpper={getDecrementUpper}
            getIncrementUpper={getIncrementUpper}
            onLeftRangeInput={onLeftRangeInput}
            onRightRangeInput={onRightRangeInput}
            currencyA={baseCurrency}
            currencyB={quoteCurrency}
            mintInfo={null}
            disabled={false}
          />
          {activePreset === Presets.FULL && fullRangeWarningShown && (
            <Warning className='text-sm'>{t('Full range position')}</Warning>
          )}
          {mintInfo.outOfRange && <Warning className='text-sm'>{t('Out range warning')}</Warning>}
          {mintInfo.invalidRange && <Warning className='text-sm'>{t('Invalid range warning')}</Warning>}
          {!mintInfo.noLiquidity && (
            <div className='-mb-2 flex items-center justify-center'>
              <TextHeading className='text-sm'>
                {t('Current Price: [price] [symbolA] [symbolB]', {
                  price: currentPrice,
                  symbolA: unwrappedSymbol(quoteCurrency),
                  symbolB: unwrappedSymbol(baseCurrency),
                })}
              </TextHeading>
            </div>
          )}
        </div>
        <LiquidityChartRangeInput
          currencyA={baseCurrency}
          currencyB={quoteCurrency}
          feeAmount={mintInfo.dynamicFee}
          ticksAtLimit={mintInfo.ticksAtLimit}
          price={price}
          priceLower={priceLower}
          priceUpper={priceUpper}
          onLeftRangeInput={onLeftRangeInput}
          onRightRangeInput={onRightRangeInput}
        />
        <div className='grid grid-cols-2 gap-4'>
          <div className='flex flex-col justify-center gap-1.5 rounded-md bg-neutral-800 px-4 py-3'>
            <TextHeading className='text-sm'>{t(mintInfo.noLiquidity ? 'New pool' : 'Current Pool')}</TextHeading>
            <div className='w-fit rounded-md bg-neutral-700 p-2'>
              <TextHeading className='text-sm'>
                {feeString} {t('Fee')}
              </TextHeading>
            </div>
          </div>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between rounded-md bg-neutral-800 px-4 py-2'>
              <TextHeading className='text-sm'>{t('Risk')}</TextHeading>
              {_risk && (
                <div className='flex items-center gap-2'>
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className='h-2 w-2 overflow-hidden rounded-full bg-neutral-700'>
                      <div
                        key={`risk-${i}`}
                        className='relative h-2 bg-error-600'
                        style={{ left: `calc(-100% + ${_risk[i]}%)` }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className='flex flex-col gap-1.5 rounded-md bg-neutral-800 px-4 py-2'>
              <div className='mt-1 flex items-center justify-between'>
                <TextHeading className='text-sm'>{t('Profit')}</TextHeading>
                {_risk && (
                  <div className='flex items-center gap-2'>
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i} className='h-2 w-2 overflow-hidden rounded-full bg-neutral-700'>
                        <div
                          key={`risk-${i}`}
                          className='relative h-2 bg-success-600'
                          style={{ left: `calc(-100% + ${_risk[i]}%)` }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <p className='font-medium text-white'>{t('Asset')}</p>
            <Tabs data={percents} />
          </div>
          <div className='flex flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
            <div className='flex items-center justify-between gap-2'>
              <input
                type='number'
                className='w-full border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
                placeholder='0.0'
                value={tokenAmount}
                disabled={false}
                onChange={e => {
                  handleInput(Number(e.target.value) < 0 ? '' : e.target.value)
                }}
                min={0}
                lang='en'
              />
            </div>
            <div className='flex items-center justify-between gap-2'>
              <TextSubHeading>${formatAmount(tokenAmount * price)}</TextSubHeading>
              <TextSubHeading>
                {t('Balance')}: {balanceString}
              </TextSubHeading>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <EmphasisButton className='w-full'>{t('Confirm')}</EmphasisButton>
      </ModalFooter>
    </Modal>
  )
}
