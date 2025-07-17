import { max as getMax } from 'd3'
import React, { useMemo } from 'react'

import { useMediaQuery } from '@/hooks/useMediaQuery'

export function LiquidityBars({
  series,
  xScale,
  yScale,
  xValue,
  yValue,
  maxBarWidth = 117, // Maximum bar width in pixels
}) {
  const { isLgDown } = useMediaQuery()
  const bars = useMemo(() => {
    if (!series || series.length === 0) return []

    if (series.length === 0) return []

    const maxLiquidity = getMax(series, xValue)
    if (!maxLiquidity || maxLiquidity === 0) return []

    return series.map((d, index) => {
      const liquidityValue = xValue(d)
      const priceValue = yValue(d)

      // Calculate bar width (horizontal length) based on liquidity value, max 117px
      const normalizedWidth = (liquidityValue / maxLiquidity) * maxBarWidth
      const barWidth = Math.max(1, Math.min(maxBarWidth, normalizedWidth))

      // const maxBarHeight = 20 // Maximum height for bars
      // const normalizedHeight = (liquidityValue / maxLiquidity) * maxBarHeight
      const barHeight = isLgDown ? 2 : 4

      // Position bars to the left of the axis
      const x = xScale(0) - barWidth
      const y = yScale(priceValue) - barHeight / 2

      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        data: d,
        index,
      }
    })
  }, [series, xValue, yValue, maxBarWidth, isLgDown, xScale, yScale])

  return bars.length > 0 ? (
    <g className='liquidity-bars' style={{ zIndex: -1 }}>
      {/* Vertical ticks along y axis, behind bars */}
      {!isLgDown &&
        (() => {
          if (!yScale) return null
          const [yMin, yMax] = yScale.domain()
          const [r0, r1] = yScale.range()
          const tickCount = 10
          const ticks = Array.from({ length: tickCount + 1 }).map((_, i) => {
            const t = i / tickCount
            const yValueTick = yScale.invert ? yScale.invert(r0 + t * (r1 - r0)) : yMin + t * (yMax - yMin)
            const y = yScale(yValueTick)
            return (
              <line
                key={`liquidity-tick-${i}`}
                x1={xScale(0)}
                x2={xScale(0) - 16}
                y1={isNaN(y) ? 0 : y}
                y2={isNaN(y) ? 0 : y}
                stroke='#685770'
                strokeWidth='3'
                opacity='0.25'
              />
            )
          })
          return ticks
        })()}
      {bars.map((bar, index) => (
        <rect
          key={`liquidity-bar-${index}`}
          x={isNaN(bar.x - (isLgDown ? 0 : 21)) ? 0 : bar.x - (isLgDown ? 0 : 21)} // Adjust x position for small screens
          y={isNaN(bar.y) ? 0 : Math.floor(bar.y)}
          width={bar.width}
          height={bar.height}
          fill='#685770'
          stroke='#685770'
          strokeWidth='2'
          rx='1'
          ry='1'
        />
      ))}
      {bars.length === 0 && series && series.length > 0 && (
        <rect x={50} y={50} width={100} height={5} fill='#FF0000' opacity={0.8} />
      )}
    </g>
  ) : null
}
