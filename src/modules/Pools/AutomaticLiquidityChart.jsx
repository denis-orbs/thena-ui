import { useEffect, useMemo } from 'react'

import { GAMMA_TYPES, ICHI_TYPES } from '@/constant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers } from '@/state/fusion/hooks'

import LiquidityChartRangeInput from './LiquidityChartRangeInput'

export default function AutomaticLiquidityChart({ currencyA, currencyB, position, handleShow, label }) {
  const { isMdDown, isXlDown, is2XlDown, is3XlDown } = useMediaQuery()

  const mintInfo = useV3DerivedMintInfo(currencyA, currencyB, 3000, currencyA, undefined)
  const { onLeftRangeInput, onRightRangeInput } = useV3MintActionHandlers(mintInfo.noLiquidity)

  const { ticksAtLimit, pricesAtTicks, presetRange } = mintInfo

  const price = useMemo(() => {
    if (position) return position.currentPrice
    if (!mintInfo.price) return
    const _price = mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
    if (_price) return parseFloat(_price)
  }, [mintInfo.invertPrice, mintInfo.price, position])

  useEffect(() => {
    if (ICHI_TYPES.includes(presetRange?.type) || GAMMA_TYPES.includes(presetRange?.type)) {
      onLeftRangeInput(presetRange ? String(+price * presetRange.min) : '')
      onRightRangeInput(presetRange ? String(+price * presetRange.max) : '')
    }
  }, [onLeftRangeInput, onRightRangeInput, presetRange, price])

  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => pricesAtTicks, [pricesAtTicks])

  const [chartWidth, chartHeight] = useMemo(() => {
    if (isMdDown) return [343, 168]
    if (isXlDown) return [802, 221]
    if (is2XlDown) return [704, 253]
    if (is3XlDown) return [704, 253]
    return [704, 253]
  }, [isMdDown, isXlDown, is2XlDown, is3XlDown])

  return (
    <LiquidityChartRangeInput
      label={label}
      currencyA={currencyA ?? undefined}
      currencyB={currencyB ?? undefined}
      feeAmount={mintInfo.dynamicFee}
      ticksAtLimit={position?.ticksAtLimit ?? ticksAtLimit}
      price={price}
      priceLower={position ? position.priceLower : priceLower}
      priceUpper={position ? position.priceUpper : priceUpper}
      onLeftRangeInput={onLeftRangeInput}
      onRightRangeInput={onRightRangeInput}
      interactive={false}
      handleShow={handleShow}
      width={chartWidth}
      height={chartHeight}
      isFixed
    />
  )
}
