import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { OutlineIconButton } from '@/components/buttons/IconButton'
import { Paragraph, TextSubHeading } from '@/components/typography'
import { formatDelta } from '@/lib/helper'
import { unwrappedSymbol } from '@/lib/utils'
import { Bound, updateIsReverse, updateSelectedPreset } from '@/state/fusion/actions'
import { useActivePreset, useInitialTokenPrice, useV3MintActionHandlers } from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'
import { MinusIcon, PlusIcon } from '@/svgs'

const inputRegex = /^\d*(?:\\[.])?\d*$/ // match escaped "." characters via in a non-capturing group

const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string

function RangePart({
  value,
  decrement,
  increment,
  decrementDisabled = false,
  tokenA,
  tokenB,
  incrementDisabled = false,
  locked,
  onUserInput,
  disabled,
  title,
  description,
}) {
  const [localTokenValue, setLocalTokenValue] = useState('')
  const t = useTranslations()

  const dispatch = useDispatch()

  const initialTokenPrice = useInitialTokenPrice()

  const enforcer = nextUserInput => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      setLocalTokenValue(nextUserInput.trim())
      dispatch(updateSelectedPreset({ preset: null }))
    }
  }

  const handleOnBlur = useCallback(() => {
    onUserInput(localTokenValue)
  }, [onUserInput, localTokenValue])

  // for button clicks
  const handleDecrement = useCallback(() => {
    onUserInput(decrement())
  }, [decrement, onUserInput])

  const handleIncrement = useCallback(() => {
    onUserInput(increment())
  }, [increment, onUserInput])

  const activePreset = useActivePreset()

  useEffect(() => {
    if (value) {
      setLocalTokenValue(value)
    } else if (value === '') {
      setLocalTokenValue('')
    }
  }, [value, initialTokenPrice])

  useEffect(() => {
    if (activePreset === Presets.FULL) {
      setLocalTokenValue(title === 'Min' ? 0 : Infinity)
    }
  }, [activePreset, title, value])

  return (
    <div className='w-full space-y-2'>
      <TextSubHeading className='text-xs'>
        {t(title === 'Min' ? 'Min [symbol0] per [symbol1] price' : 'Max [symbol0] per [symbol1] price', {
          symbol0: unwrappedSymbol(tokenB),
          symbol1: unwrappedSymbol(tokenA),
        })}
      </TextSubHeading>

      <div className='flex items-center justify-between rounded-xl border border-neutral-700 px-4 py-3'>
        <div className='flex flex-col gap-1.5'>
          <input
            type={activePreset === Presets.FULL ? 'text' : 'number'}
            className='w-full border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
            placeholder='0.0'
            value={localTokenValue}
            onChange={e => {
              // replace commas with periods, because uniswap exclusively uses period as the decimal separator
              enforcer(e.target.value.replace(/,/g, '.'))
            }}
            onBlur={handleOnBlur}
            min={0}
            disabled={disabled || locked}
            onFocus={e => e.target.select()}
          />
          <Paragraph className='text-[10px] text-neutral-300'>{description}</Paragraph>
        </div>
        <div className='flex flex-col gap-2'>
          <OutlineIconButton
            className='h-6 w-6 lg:h-6 lg:w-6'
            classNames='h-4 w-4 lg:h-4 lg:w-4'
            Icon={PlusIcon}
            onClick={handleIncrement}
            disabled={incrementDisabled || disabled}
          />
          <OutlineIconButton
            className='h-6 w-6 lg:h-6 lg:w-6'
            classNames='h-4 w-4 lg:h-4 lg:w-4'
            Icon={MinusIcon}
            onClick={handleDecrement}
            disabled={decrementDisabled || disabled}
          />
        </div>
      </div>
    </div>
  )
}

export function RangeSelector({
  price,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  getDecrementLower,
  getIncrementLower,
  getDecrementUpper,
  getIncrementUpper,
  currencyA,
  currencyB,
  disabled,
  mintInfo,
}) {
  const dispatch = useDispatch()
  const { onFieldAInput, onFieldBInput } = useV3MintActionHandlers(mintInfo.noLiquidity)
  const { isReverse } = useSelector(state => state.fusion)

  const tokenA = (currencyA ?? undefined)?.wrapped
  const tokenB = (currencyB ?? undefined)?.wrapped
  const isSorted = useMemo(() => tokenA && tokenB && tokenA.sortsBefore(tokenB), [tokenA, tokenB])

  const leftPrice = useMemo(() => (isSorted ? priceLower : priceUpper?.invert()), [isSorted, priceLower, priceUpper])
  const rightPrice = useMemo(() => (isSorted ? priceUpper : priceLower?.invert()), [isSorted, priceUpper, priceLower])

  const handleRevert = () => {
    if (isReverse) {
      if (!mintInfo?.ticksAtLimit[Bound.LOWER] && !mintInfo?.ticksAtLimit[Bound.UPPER]) {
        onLeftRangeInput((mintInfo.invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
        onRightRangeInput((mintInfo.invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
      }
    } else if (!mintInfo?.ticksAtLimit[Bound.LOWER] && !mintInfo?.ticksAtLimit[Bound.UPPER]) {
      onLeftRangeInput((mintInfo.invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
      onRightRangeInput((mintInfo.invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
    }
    dispatch(updateIsReverse({ isReverse: !isReverse }))
    onFieldAInput('')
    onFieldBInput('')
  }

  const brushLabelValue = useCallback(
    (d, x) => {
      if (!price) return ''

      if (d === 'w' && mintInfo?.ticksAtLimit?.[isSorted ? Bound.LOWER : Bound.UPPER]) return '0'
      if (d === 'e' && mintInfo?.ticksAtLimit?.[isSorted ? Bound.UPPER : Bound.LOWER]) return '∞'

      const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

      return price && !isNaN(percent) ? `${(Math.sign(percent) < 0 ? '-' : '+') + formatDelta(percent)}` : '-'
    },
    [isSorted, price, mintInfo?.ticksAtLimit],
  )

  return (
    <div className='flex items-center gap-3'>
      <RangePart
        value={mintInfo?.ticksAtLimit[Bound.LOWER] ? '0' : leftPrice?.toSignificant(5) ?? ''}
        onUserInput={onLeftRangeInput}
        decrement={isSorted ? getDecrementLower : getIncrementUpper}
        increment={isSorted ? getIncrementLower : getDecrementUpper}
        decrementDisabled={mintInfo?.ticksAtLimit[Bound.LOWER]}
        incrementDisabled={mintInfo?.ticksAtLimit[Bound.LOWER]}
        label={leftPrice ? `${currencyB?.symbol}` : '-'}
        tokenA={currencyA}
        tokenB={currencyB}
        disabled={disabled}
        title='Min'
        description={brushLabelValue('w', leftPrice?.toSignificant(5))}
      />

      <button
        className='flex h-20 items-center self-end rounded-lg bg-neutral-600 p-1 text-neutral-400'
        aria-label='Swap price range bounds'
        type='button'
        onClick={handleRevert}
      >
        <svg width='16' height='17' viewBox='0 0 16 17' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M2.66797 11.515L13.3346 11.515M13.3346 11.515L10.668 8.84831M13.3346 11.515L10.668 14.1816M13.3346 4.84831L2.66797 4.84831M2.66797 4.84831L5.33464 2.18164M2.66797 4.84831L5.33464 7.51497'
            stroke='#B3ABB7'
            strokeWidth='1.33'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </button>

      <RangePart
        value={mintInfo?.ticksAtLimit[Bound.UPPER] ? '∞' : rightPrice?.toSignificant(5) ?? ''}
        onUserInput={onRightRangeInput}
        decrement={isSorted ? getDecrementUpper : getIncrementLower}
        increment={isSorted ? getIncrementUpper : getDecrementLower}
        incrementDisabled={mintInfo?.ticksAtLimit[Bound.UPPER]}
        decrementDisabled={mintInfo?.ticksAtLimit[Bound.UPPER]}
        label={rightPrice ? `${currencyB?.symbol}` : '-'}
        tokenA={currencyA ?? undefined}
        tokenB={currencyB ?? undefined}
        initialPrice={mintInfo?.price}
        disabled={disabled}
        title='Max'
        description={brushLabelValue('e', rightPrice?.toSignificant(5))}
      />
    </div>
  )
}
