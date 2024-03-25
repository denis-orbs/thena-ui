import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'

import { OutlineIconButton } from '@/components/buttons/IconButton'
import { Paragraph, TextSubHeading } from '@/components/typography'
import { unwrappedSymbol } from '@/lib/utils'
import { Bound, updateSelectedPreset } from '@/state/fusion/actions'
import { useInitialTokenPrice } from '@/state/fusion/hooks'
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

  useEffect(() => {
    if (value) {
      setLocalTokenValue(value)
    } else if (value === '') {
      setLocalTokenValue('')
    }
  }, [initialTokenPrice, value])

  return (
    <div className='flex items-center justify-between rounded-xl border border-neutral-700 px-4 py-3'>
      <div className='flex flex-col gap-1.5'>
        <TextSubHeading className='text-xs'>{t(title)}</TextSubHeading>
        <input
          type='number'
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
        />
        <Paragraph className='text-[10px]'>
          {t('[symbolA] per [symbolB]', {
            symbolA: unwrappedSymbol(tokenB),
            symbolB: unwrappedSymbol(tokenA),
          })}
        </Paragraph>
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
  )
}

export function RangeSelector({
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
  const tokenA = (currencyA ?? undefined)?.wrapped
  const tokenB = (currencyB ?? undefined)?.wrapped
  const isSorted = useMemo(() => tokenA && tokenB && tokenA.sortsBefore(tokenB), [tokenA, tokenB])

  const leftPrice = useMemo(() => (isSorted ? priceLower : priceUpper?.invert()), [isSorted, priceLower, priceUpper])

  const rightPrice = useMemo(() => (isSorted ? priceUpper : priceLower?.invert()), [isSorted, priceUpper, priceLower])

  return (
    <div className='grid grid-cols-2 gap-3'>
      <RangePart
        value={mintInfo.ticksAtLimit[Bound.LOWER] ? '0' : leftPrice?.toSignificant(5) ?? ''}
        onUserInput={onLeftRangeInput}
        decrement={isSorted ? getDecrementLower : getIncrementUpper}
        increment={isSorted ? getIncrementLower : getDecrementUpper}
        decrementDisabled={mintInfo.ticksAtLimit[Bound.LOWER]}
        incrementDisabled={mintInfo.ticksAtLimit[Bound.LOWER]}
        label={leftPrice ? `${currencyB?.symbol}` : '-'}
        tokenA={currencyA}
        tokenB={currencyB}
        disabled={disabled}
        title='Min Price'
      />
      <RangePart
        value={mintInfo.ticksAtLimit[Bound.UPPER] ? '∞' : rightPrice?.toSignificant(5) ?? ''}
        onUserInput={onRightRangeInput}
        decrement={isSorted ? getDecrementUpper : getIncrementLower}
        increment={isSorted ? getIncrementUpper : getDecrementLower}
        incrementDisabled={mintInfo.ticksAtLimit[Bound.UPPER]}
        decrementDisabled={mintInfo.ticksAtLimit[Bound.UPPER]}
        label={rightPrice ? `${currencyB?.symbol}` : '-'}
        tokenA={currencyA ?? undefined}
        tokenB={currencyB ?? undefined}
        initialPrice={mintInfo.price}
        disabled={disabled}
        title='Max Price'
      />
    </div>
  )
}
