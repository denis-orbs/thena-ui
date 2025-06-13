import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { cn, formatAmount } from '@/lib/utils'
import { HalfPolygonIcon, InfoCircleSmall, PolygonIcon } from '@/svgs'

function Range({ currentPrice, maxPrice, minPrice, liquidity, isFullRange = false }) {
  const t = useTranslations()
  const outOfRange = currentPrice ? currentPrice < minPrice || currentPrice >= maxPrice : false
  const [currentHover, setCurrentHover] = useState(null)
  const currentPercent = useMemo(() => {
    if (currentPrice && !outOfRange) {
      const range = maxPrice - minPrice
      const current = currentPrice - minPrice
      return (current / range) * 100
    }
    return 0
  }, [currentPrice, maxPrice, minPrice, outOfRange])

  // const [tickLowerPercent, tickUpperPercent] = useMemo(() => {
  //   if (currentPrice) {
  //     return [((minPrice - currentPrice) / currentPrice) * 100, ((maxPrice - currentPrice) / currentPrice) * 100]
  //   }
  //   return [0, 0]
  // }, [currentPrice, maxPrice, minPrice])

  // Fixed out of range logic
  const outOfRangePosition = useMemo(() => {
    if (!outOfRange) return { percent: 0, isBelow: false, isAbove: false }

    const isBelow = currentPrice <= minPrice
    const isAbove = currentPrice >= maxPrice

    // Position the indicator at the appropriate boundary
    if (isBelow) {
      return { percent: 0, isBelow: true, isAbove: false }
    }
    if (isAbove) {
      return { percent: 100, isBelow: false, isAbove: true }
    }

    return { percent: 0, isBelow: false, isAbove: false }
  }, [currentPrice, maxPrice, minPrice, outOfRange])

  // Calculate the visual width for the range bar when out of range
  const rangeBarWidth = useMemo(() => {
    if (!outOfRange) return 100

    const range = maxPrice - minPrice
    const totalRange = outOfRangePosition.isBelow ? maxPrice - currentPrice : currentPrice - minPrice

    return Math.min(100, (range / totalRange) * 100)
  }, [currentPrice, maxPrice, minPrice, outOfRange, outOfRangePosition])

  return (
    <>
      {!Number(liquidity) ? (
        <div
          className={cn(
            'relative flex h-5 items-center justify-center overflow-hidden px-2',
            'border-warn-800 bg-warn-950 text-warn-700 rounded-md border text-xs leading-4',
          )}
        >
          {t('Closed')}
        </div>
      ) : outOfRange ? (
        <div className='flex h-[54px] flex-col items-center justify-center'>
          {/* Range bar */}
          <div className='relative h-5 w-full rounded-md border border-neutral-600 !px-2'>
            <div className='absolute inset-0 h-[18px] w-full overflow-hidden rounded-[5px]'>
              {/* Background gradient for in-range */}
              <div
                style={{ left: `${outOfRangePosition.percent}%` }}
                className='absolute top-0 z-30 h-[18px] w-full -translate-x-1/2 transform'
              >
                <div
                  className={cn(
                    'absolute h-full w-full rounded-[5px] transition-opacity duration-200',
                    'bg-[linear-gradient(90deg,rgba(131,0,126,0)_31%,rgba(189,96,186,0.5)_52%,rgba(143,20,138,0)_75%)]',
                  )}
                />
              </div>
            </div>
            <div className='relative flex h-5 w-full items-center justify-center overflow-visible'>
              {/* Hover tooltips */}
              {currentHover === 'current-price' && (
                <div
                  className={cn(
                    'absolute -top-5.5 z-20',
                    outOfRangePosition.percent <= 10
                      ? 'left-0'
                      : outOfRangePosition.percent >= 90
                        ? 'right-0'
                        : 'left-1/2 -translate-x-1/2',
                  )}
                  style={{
                    left:
                      outOfRangePosition.percent <= 10
                        ? '0'
                        : outOfRangePosition.percent >= 90
                          ? 'auto'
                          : `${outOfRangePosition.percent}%`,
                  }}
                >
                  <div className={cn('relative flex items-center justify-center')}>
                    <span className='text-xs leading-4 text-nowrap text-neutral-50'>{formatAmount(currentPrice)}</span>
                  </div>
                </div>
              )}
              {currentHover === 'min-price' && (
                <div
                  className='absolute -top-5.5 z-40'
                  style={{
                    left: outOfRangePosition.isBelow ? `${100 - rangeBarWidth}%` : '0%',
                  }}
                >
                  <div className={cn('relative flex items-center justify-center')}>
                    <span className='text-xs leading-4 text-nowrap text-neutral-50'>
                      Lower: {formatAmount(minPrice)}
                    </span>
                  </div>
                </div>
              )}

              {currentHover === 'max-price' && (
                <div
                  className='absolute -top-5.5 z-40'
                  style={{
                    right: outOfRangePosition.isBelow ? '0%' : `${100 - rangeBarWidth}%`,
                  }}
                >
                  <div className={cn('relative flex items-center justify-center')}>
                    <span className='text-xs leading-4 text-nowrap text-neutral-50'>
                      Upper: {formatAmount(maxPrice, true)}
                    </span>
                  </div>
                </div>
              )}
              {/* Range boundaries */}
              <div
                className='bg-warn-950 absolute top-0 flex h-[18px] items-center justify-between'
                style={{
                  left:
                    outOfRangePosition.isBelow && rangeBarWidth !== 100
                      ? `calc(${100 - rangeBarWidth}% + 8px)`
                      : 'calc(0% + 8px)',
                  width: `calc(${rangeBarWidth}% - 16px)`,
                }}
              />
              <div
                className='absolute top-0 h-full'
                style={{
                  left: outOfRangePosition.isBelow ? `${100 - rangeBarWidth}%` : '0%',
                  width: `${rangeBarWidth}%`,
                }}
              >
                <HalfPolygonIcon
                  className={cn(
                    'hover:text-warn-500 stroke-warn-600 absolute bottom-[2px] left-0 z-40 size-4 cursor-pointer text-transparent',
                  )}
                  onMouseEnter={() => setCurrentHover('min-price')}
                  onMouseLeave={() => setCurrentHover(null)}
                />

                <HalfPolygonIcon
                  className={cn(
                    'hover:text-warn-500 stroke-warn-600 absolute top-[1px] right-0',
                    'z-40 size-4 rotate-180 cursor-pointer text-transparent',
                  )}
                  onMouseEnter={() => setCurrentHover('max-price')}
                  onMouseLeave={() => setCurrentHover(null)}
                />
              </div>
              {/* Current price indicator */}
              <div
                style={{
                  left: `clamp(8px, ${outOfRangePosition.percent}%, calc(100% - 8px))`,
                  transform: 'translateX(-50%)',
                }}
                className={cn('absolute top-0 z-30 flex h-full transform items-center justify-center')}
              >
                <PolygonIcon
                  className={cn(
                    'text-primary-300 h-7 w-4 cursor-pointer transition-all duration-200 ease-in-out',
                    'hover:text-primary-200',
                  )}
                  onMouseEnter={() => setCurrentHover('current-price')}
                  onMouseLeave={() => setCurrentHover(null)}
                />
              </div>
              {/* Out of range indicator */}
              <div
                style={{ left: outOfRangePosition.isBelow ? `${100 - rangeBarWidth}%` : '0%' }}
                className='absolute top-5.5 flex items-center gap-2 text-xs leading-4'
              >
                <InfoCircleSmall className='stroke-warn-700 size-3' />
                <span className='text-warn-700'>Out of Range</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='flex h-[54px] items-center justify-center gap-1'>
          <div className='relative h-5 w-full rounded-md border border-neutral-600 !px-2'>
            <div className='absolute inset-0 h-[18px] w-full overflow-hidden rounded-[5px]'>
              {/* Background gradient for in-range */}
              <div
                style={{ left: isFullRange ? '50%' : `${currentPercent}%` }}
                className='absolute top-0 h-full w-full -translate-x-1/2 transform'
              >
                <div
                  className={cn(
                    'absolute h-full w-full transition-opacity duration-200',
                    'bg-[linear-gradient(90deg,rgba(131,0,126,0)_31%,rgba(189,96,186,0.5)_52%,rgba(143,20,138,0)_75%)]',
                  )}
                />
              </div>
            </div>
            <div className='relative flex h-5 w-full items-center justify-center overflow-visible'>
              {/* Hover tooltips for in-range */}
              {currentHover === 'current-price' && (
                <div
                  style={{ left: `${currentPercent}%` }}
                  className={cn(
                    'absolute -top-5.5 z-20',
                    currentPercent < 90 && currentPercent > 10 && '-translate-x-1/2',
                    currentPercent > 90 && 'right-0 -translate-x-0',
                    currentPercent < 10 && 'left-0 translate-x-0',
                  )}
                >
                  <div
                    className={cn(
                      'relative flex items-center justify-center',

                      currentPercent > 90 && 'right-0 translate-x-0',
                      currentPercent < 10 && 'left-0 translate-x-0',
                    )}
                  >
                    <span className='text-xs leading-4 text-nowrap text-neutral-50'>{formatAmount(currentPrice)}</span>
                  </div>
                </div>
              )}
              {currentHover === 'min-price' && (
                <div style={{ left: 0 }} className={cn('absolute -top-5.5 z-20')}>
                  <div className={cn('relative flex items-center justify-center')}>
                    <span className='text-xs leading-4 text-nowrap text-neutral-50'>
                      Lower: {isFullRange ? '0' : formatAmount(minPrice)}
                    </span>
                  </div>
                </div>
              )}
              {currentHover === 'max-price' && (
                <div style={{ right: 0 }} className={cn('absolute -top-5.5 z-20')}>
                  <div className={cn('relative flex items-center justify-center')}>
                    <span className='text-xs leading-4 text-nowrap text-neutral-50'>
                      Upper: {isFullRange ? '∞' : formatAmount(maxPrice, true)}
                    </span>
                  </div>
                </div>
              )}
              <div className='flex w-full justify-between'>
                <HalfPolygonIcon
                  className={cn(
                    'absolute bottom-[2px] left-0 z-20 size-4! cursor-pointer',
                    'justify-items-start stroke-neutral-500 text-transparent hover:text-neutral-300',
                  )}
                  onMouseEnter={() => setCurrentHover('min-price')}
                  onMouseLeave={() => setCurrentHover(null)}
                />
                <HalfPolygonIcon
                  className={cn(
                    'absolute top-[1px] right-0 z-20 size-4! rotate-180 cursor-pointer justify-items-end',
                    'stroke-neutral-500 text-transparent hover:text-neutral-300',
                  )}
                  onMouseEnter={() => setCurrentHover('max-price')}
                  onMouseLeave={() => setCurrentHover(null)}
                />
              </div>
              {/* Current price indicator for in-range */}
              <div
                style={{
                  left: `clamp(8px, ${isFullRange ? '50' : currentPercent}%, calc(100% - 8px))`,
                  transform: 'translateX(-50%)',
                }}
                className={cn('absolute top-0 flex h-full transform items-center justify-center')}
              >
                <PolygonIcon
                  className={cn(
                    'text-primary-300 z-30 h-7 w-4 cursor-pointer drop-shadow-[1px_3px_5px_#2c000240] transition-all duration-200 ease-in-out',
                    currentHover === 'current-price' && 'text-primary-200 drop-shadow-[2px_4px_8px_#2c000260]',
                  )}
                  onMouseEnter={() => setCurrentHover('current-price')}
                  onMouseLeave={() => setCurrentHover(null)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Range
