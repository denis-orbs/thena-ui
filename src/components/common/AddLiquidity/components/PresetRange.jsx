import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Selection from '@/components/selection'
import { formatAmount } from '@/lib/utils'
import { useAprStore } from '@/state/APR/store'
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
  const { APRs } = useAprStore()
  const t = useTranslations()

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
        label: (
          <div className='flex flex-row items-center justify-center gap-3 2xl:gap-4'>
            {t(range.title)}{' '}
            <NeutralBadge className='whitespace-nowrap lg:text-xs'>{formatAmount(APRs?.[range.type])} %</NeutralBadge>
          </div>
        ),
        active: activePreset === range.type,
        onClickHandler: () => {
          handlePresetRangeSelection(range)
          onChangePresetRange(range)
        },
      })),
    [ranges, APRs, t, activePreset, handlePresetRangeSelection, onChangePresetRange],
  )

  return (
    <Selection
      className='grid grid-cols-2 items-stretch gap-x-0.5 gap-y-2 lg:grid-cols-4 lg:items-center lg:gap-0.5 [&>button]:py-2 [&>button]:text-sm'
      data={rangeSelections}
      isFull
      isTranslation={false}
    />
  )
}
