import React, { useMemo } from 'react'

import Selection from '@/components/selection'
import { formatAmount } from '@/lib/utils'
import { useV3MintActionHandlers } from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'

const PresetProfits = {
  VERY_LOW: 'VERY_LOW',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
}

export function PresetRanges({ mintInfo, isStablecoinPair, activePreset, handlePresetRangeSelection }) {
  const { onChangePresetRange } = useV3MintActionHandlers(mintInfo.noLiquidity)
  const { estimateAPR } = mintInfo

  const ranges = useMemo(() => {
    if (isStablecoinPair) {
      return [
        {
          type: Presets.STABLE,
          title: 'Stable',
          min: 0.984,
          max: 1.016,
          risk: PresetProfits.VERY_LOW,
          profit: PresetProfits.HIGH,
        },
      ]
    }

    return [
      {
        type: Presets.FULL,
        title: 'Full Range',
        min: 0,
        max: Infinity,
        risk: PresetProfits.VERY_LOW,
        profit: PresetProfits.VERY_LOW,
      },
      {
        type: Presets.SAFE,
        title: 'Safe',
        min: 0.8,
        max: 1.2,
        risk: PresetProfits.LOW,
        profit: PresetProfits.LOW,
      },
      {
        type: Presets.NORMAL,
        title: 'Common',
        min: 0.9,
        max: 1.1,
        risk: PresetProfits.MEDIUM,
        profit: PresetProfits.MEDIUM,
      },
      {
        type: Presets.RISK,
        title: 'Expert',
        min: 0.95,
        max: 1.05,
        risk: PresetProfits.HIGH,
        profit: PresetProfits.HIGH,
      },
    ]
  }, [isStablecoinPair])

  const rangeSelections = useMemo(
    () =>
      ranges.map(range => ({
        label: `${range.title} (${formatAmount(estimateAPR[range.type])}%)`,
        active: activePreset === range.type,
        onClickHandler: () => {
          handlePresetRangeSelection(range)
          onChangePresetRange(range)
        },
      })),
    [ranges, estimateAPR, activePreset, handlePresetRangeSelection, onChangePresetRange],
  )

  return (
    <div className='flex flex-col gap-3'>
      {/* <div className='flex items-center justify-between'> */}
      {/*   <TextHeading>{t('Range Type')}</TextHeading> */}
      {/* </div> */}
      <Selection data={rangeSelections} isFull />
    </div>
  )
}
