import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EmphasisIconButton } from '@/components/buttons/IconButton'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import { Paragraph } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { Bound, updateIsReverse } from '@/state/fusion/actions'
import { useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { TransferIcon } from '@/svgs'

export default function StartingPriceInput({ baseCurrency, quoteCurrency, mintInfo, lastPrice }) {
  const t = useTranslations()
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])
  const dispatch = useDispatch()

  const { startPriceTypedValue } = useV3MintState()
  const { onStartPriceInput, onLeftRangeInput, onRightRangeInput, onFieldAInput, onFieldBInput } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const { isReverse } = useSelector(state => state.fusion)

  const handleRevert = useCallback(() => {
    if (!mintInfo?.ticksAtLimit[Bound.LOWER] && !mintInfo?.ticksAtLimit[Bound.UPPER]) {
      onLeftRangeInput((mintInfo.invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '')
      onRightRangeInput((mintInfo.invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '')
    }
    dispatch(updateIsReverse({ isReverse: !isReverse }))
    onFieldAInput('')
    onFieldBInput('')
    onStartPriceInput(mintInfo.invertPrice ? mintInfo.price.toSignificant(5) : mintInfo.price.invert().toSignificant(5))
  }, [
    dispatch,
    isReverse,
    mintInfo.invertPrice,
    mintInfo.price,
    mintInfo?.ticksAtLimit,
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
    priceLower,
    priceUpper,
  ])

  useEffect(() => {
    if (!startPriceTypedValue && lastPrice) {
      onStartPriceInput(`${lastPrice}`)
    }
  }, [lastPrice, onStartPriceInput, startPriceTypedValue])

  return (
    <div className='flex items-end gap-2 md:gap-8'>
      <div className='flex w-full flex-col gap-1 lg:max-w-[280px] lg:gap-2'>
        <div className='flex items-center justify-between'>
          <Paragraph className='xl:text-4 text-xs font-medium text-neutral-50 md:text-base xl:leading-5'>
            {t('Initialization Price')}
          </Paragraph>
          <Paragraph className='xl:text-4 text-base font-normal text-neutral-300 xl:leading-5'>
            {t('[symbolA] per [symbolB]', {
              symbolA: quoteCurrency?.symbol,
              symbolB: baseCurrency?.symbol,
            })}
          </Paragraph>
        </div>
        <Input
          classNames={{
            input: 'leading-5 xl:py-0 xl:h-11',
          }}
          val={startPriceTypedValue}
          min={0}
          onChange={e => onStartPriceInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === '-' || e.key === '+') {
              e.preventDefault()
              return false
            }
          }}
        />
      </div>

      <div className='flex h-11 items-center gap-4'>
        <CircleImage
          className='size-6 outline-[#1C2027] outline-solid md:size-9'
          src={quoteCurrency?.logoURI ?? UNKNOWN_LOGO}
          alt='quote token'
        />
        <EmphasisIconButton
          className='size-6 rounded-[4px] md:size-11 md:rounded-lg'
          Icon={TransferIcon}
          onClick={handleRevert}
        />
        <CircleImage
          className='size-6 outline-[#1C2027] outline-solid md:size-9'
          src={baseCurrency?.logoURI ?? UNKNOWN_LOGO}
          alt='base token'
        />
      </div>
    </div>
  )
}
