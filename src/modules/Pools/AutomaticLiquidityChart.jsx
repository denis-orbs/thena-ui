import { useEffect, useMemo } from 'react'

import { GAMMA_TYPES, ICHI_TYPES } from '@/constant'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers } from '@/state/fusion/hooks'

import LiquidityChartRangeInput from './LiquidityChartRangeInput'

export default function AutomaticLiquidityChart({ currencyA, currencyB, position, handleShow }) {
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

  return (
    <LiquidityChartRangeInput
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
      position={position}
    />
  )
}
