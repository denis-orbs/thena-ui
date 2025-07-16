import { max as getMax } from 'd3'
import React, { useMemo } from 'react'

export function LiquidityBars({
  series,
  xScale,
  yScale,
  xValue,
  yValue,
  maxBarWidth = 117, // Maximum bar width in pixels
}) {
  const bars = useMemo(() => {
    if (!series || series.length === 0) return []

    // Always show all liquidity bars, don't filter by brushDomain
    const filteredSeries = series

    if (filteredSeries.length === 0) return []

    const maxLiquidity = getMax(filteredSeries, xValue)
    if (!maxLiquidity || maxLiquidity === 0) return []

    return filteredSeries.map((d, index) => {
      const liquidityValue = xValue(d)
      const priceValue = yValue(d)

      // Calculate bar width (horizontal length) based on liquidity value, max 117px
      const normalizedWidth = (liquidityValue / maxLiquidity) * maxBarWidth
      const barWidth = Math.max(1, Math.min(maxBarWidth, normalizedWidth))

      // const maxBarHeight = 20 // Maximum height for bars
      // const normalizedHeight = (liquidityValue / maxLiquidity) * maxBarHeight
      const barHeight = 4

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
  }, [series, xScale, yScale, xValue, yValue, maxBarWidth])

  return (
    <g className='liquidity-bars'>
      {bars.map((bar, index) => (
        <rect
          key={`liquidity-bar-${index}`}
          x={bar.x}
          y={bar.y}
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
  )
}
