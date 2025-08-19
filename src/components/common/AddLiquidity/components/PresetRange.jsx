import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { Paragraph } from '@/components/typography'
import { cn, formatAmount } from '@/lib/utils'
import { useAprStore } from '@/state/APR/store'
import { useV3MintActionHandlers } from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'
import { ChevronSelectorVerticalIcon, InfinityIcon } from '@/svgs'

const PresetProfits = {
  VERY_LOW: 'VERY_LOW',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
}

export function PresetRanges({
  mintInfo,
  isStablecoinPair,
  activePreset,
  handlePresetRangeSelection,
  className,
  isMiniItem = false,
}) {
  const { onChangePresetRange } = useV3MintActionHandlers(mintInfo.noLiquidity)
  const { APRs } = useAprStore()
  const t = useTranslations()

  const ranges = useMemo(() => {
    if (isStablecoinPair) {
      return [
        {
          type: Presets.STABLE,
          title: 'Stable',
          percent: '±0.05%',
          min: 0.9995,
          max: 1.0005,
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
        title: 'Broad',
        percent: '±20%',
        min: 0.8,
        max: 1.2,
        risk: PresetProfits.LOW,
        profit: PresetProfits.LOW,
      },
      {
        type: Presets.NORMAL,
        title: 'Moderate',
        percent: '±10%',
        min: 0.9,
        max: 1.1,
        risk: PresetProfits.MEDIUM,
        profit: PresetProfits.MEDIUM,
      },
      {
        type: Presets.RISK,
        title: 'Tight',
        percent: '±5%',
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
          <div className='gap flex flex-col items-center justify-center'>
            <Paragraph className='text-primary-600 font-bold lg:text-sm'>
              {isMiniItem ? '' : 'APR:'} {formatAmount(APRs?.[range.type])}%
            </Paragraph>
            <div className={cn('flex items-center gap-4', isMiniItem && 'flex-col gap-0')}>
              <Paragraph className={cn('text-xs lg:text-xs', isMiniItem && 'order-2')}>{t(range.title)}</Paragraph>
              {range.percent ? (
                <div className={cn('flex items-center gap-1', isMiniItem && 'order-1')}>
                  <ChevronSelectorVerticalIcon className='size-4' />
                  <Paragraph className='text-xs lg:text-xs'>{range.percent}</Paragraph>
                </div>
              ) : (
                <InfinityIcon className={cn('size-4', isMiniItem && 'order-1')} />
              )}
            </div>
          </div>
        ),
        active: activePreset === range.type,
        onClickHandler: () => {
          handlePresetRangeSelection(range)
          onChangePresetRange(range)
        },
      })),
    [ranges, APRs, t, activePreset, handlePresetRangeSelection, onChangePresetRange, isMiniItem],
  )

  return (
    <div
      className={cn(
        'grid grid-cols-2 bg-neutral-900 md:grid-cols-4',
        'items-stretch gap-1 rounded-xl md:items-center',
        isStablecoinPair && 'grid-cols-1 md:grid-cols-1',
        className,
      )}
    >
      {rangeSelections.map((range, index) => (
        <div
          key={index}
          onClick={range.onClickHandler}
          className={cn(
            'cursor-pointer rounded-xl bg-neutral-800 px-4 py-2 hover:bg-neutral-700',
            range.active && 'bg-neutral-700',
            isMiniItem && 'px-2.5',
          )}
        >
          {range.label}
        </div>
      ))}
    </div>
  )
}
