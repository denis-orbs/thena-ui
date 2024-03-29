import React, { useMemo } from 'react'

import Selection from '@/components/selection'
import CustomTooltip from '@/components/tooltip'
import { TextHeading } from '@/components/typography'
import { useV3MintActionHandlers } from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'
import { InfoIcon } from '@/svgs'

const PresetProfits = {
  VERY_LOW: 'VERY_LOW',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
}

export function PresetRanges({ mintInfo, isStablecoinPair, activePreset, handlePresetRangeSelection }) {
  // const [init, setInit] = useState(false)
  const { onChangePresetRange } = useV3MintActionHandlers(mintInfo.noLiquidity)

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
        title: 'Full range',
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
        label: range.title,
        active: activePreset === range.type,
        onClickHandler: () => {
          if (activePreset === range.type) {
            handlePresetRangeSelection(null)
          } else {
            handlePresetRangeSelection(range)
          }
          onChangePresetRange(range)
        },
      })),
    [ranges, activePreset, handlePresetRangeSelection, onChangePresetRange],
  )

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <TextHeading>Range Type</TextHeading>
        <InfoIcon className='h-4 w-4 cursor-pointer stroke-neutral-400' data-tooltip-id='price-tooltip' />
      </div>
      <Selection data={rangeSelections} isFull />
      <CustomTooltip id='price-tooltip' className='max-w-[320px]'>
        <TextHeading className='tex t-sm'>Range Type Info</TextHeading>
      </CustomTooltip>
    </div>
  )
}
