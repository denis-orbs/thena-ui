import { axisRight, select } from 'd3'
import React, { useCallback, useMemo } from 'react'

import './style.css'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatPrice } from '@/utils/utils'

const labelWidth = 55
const labelHeight = 28
const paddingY = 6

function Axis({ axisGenerator }) {
  const axisRef = axis => {
    // eslint-disable-next-line no-unused-expressions
    axis &&
      select(axis)
        .call(axisGenerator)
        .call(g => g.select('.domain').remove())
        .selectAll('.tick text')
        .style('font-size', '12px')
        .style('font-weight', '700')
        .style('line-height', '16px')
        .style('color', '#685770')
  }

  return <g className='axis-right-ref' ref={axisRef} />
}

export function AxisRight({ yScale, offset = 0, min, current, max, currentHover, interactive = true }) {
  const { isLgDown } = useMediaQuery()

  const tickFormat = useCallback(d => {
    const str = d.toString()
    let decimal = 1
    if (str.includes('.')) {
      decimal = Number(`0.${str.split('.')[1]}`)
    }
    return `${decimal <= 1e-5 ? d.toExponential(0) : formatPrice(d)}`
  }, [])

  const axisGenerator = useMemo(() => {
    const tickValues = yScale.ticks(5).filter(tick => tick >= 0)
    return axisRight(yScale).tickValues(tickValues).tickFormat(tickFormat)
  }, [tickFormat, yScale])

  const [minY, maxY, currentY] = useMemo(() => {
    const minValue = min !== undefined && min > 0 ? yScale(min) : undefined
    const maxValue = max !== undefined && max > 0 ? yScale(max) : undefined
    const currentValue = current !== undefined && current > 0 ? yScale(current) : undefined
    return [minValue, maxValue, currentValue]
  }, [current, max, min, yScale])

  const currentLabel = useMemo(
    () => (current !== undefined ? `${current <= 1e-5 ? current.toExponential(0) : formatPrice(current)}` : ''),
    [current],
  )

  const renderHoverLines = useCallback(
    (y, direction) => {
      if (currentHover === direction) {
        return null
      }
      return (
        <svg x={10} y={y - 4} width='20' height='8' viewBox='0 0 20 8' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M1.68588 5.69486C0.434957 4.91118 0.434956 3.08882 1.68588 2.30514L4.02288 0.841036C4.34115 0.641646 4.70912 0.535899 5.08469 0.535899L14.994 0.535898C15.3696 0.535898 15.7376 0.641646 16.0558 0.841035L18.3928 2.30514C19.6437 3.08882 19.6438 4.91118 18.3928 5.69486L16.0558 7.15896C15.7376 7.35835 15.3696 7.4641 14.994 7.4641L5.08469 7.4641C4.70912 7.4641 4.34115 7.35835 4.02288 7.15896L1.68588 5.69486Z'
            fill={interactive ? '#F199EE' : '#35243D'}
            stroke={interactive ? '#EA66E5' : '#685770'}
            strokeWidth='1'
          />
        </svg>
      )
    },
    [currentHover, interactive],
  )

  return (
    <>
      <g className='axis-right' transform={`translate(${offset}, 0)`}>
        {!isNaN(minY) && !isLgDown && renderHoverLines(minY, 'south')}
        {!isNaN(maxY) && !isLgDown && renderHoverLines(maxY, 'north')}
        <Axis axisGenerator={axisGenerator} />
        {!isNaN(currentY) && (
          <g style={{ padding: '6px' }}>
            <rect
              x={2}
              y={currentY - labelHeight / 2}
              width={labelWidth}
              height={labelHeight}
              rx='10'
              ry='10'
              fill='#F8CCF6'
            />
            <text x={(5 + labelWidth) / 2} y={currentY + paddingY / 2} textAnchor='middle' fontSize='12' fill='#685770'>
              {currentLabel}
            </text>
          </g>
        )}
        {!isNaN(minY) && currentHover === 'south' && (
          <>
            <g className='min-label-container'>
              <rect
                x={2}
                y={minY - labelHeight / 2}
                width={labelWidth}
                height={labelHeight}
                rx='10'
                ry='10'
                fill='#292929'
              />
              <text x={(5 + labelWidth) / 2} y={minY + paddingY / 2} textAnchor='middle' fontSize='12' fill='#F199EE'>
                {min <= 1e-5 ? min.toExponential(0) : formatPrice(min)}
              </text>
            </g>
          </>
        )}

        {!isNaN(maxY) && currentHover === 'north' && (
          <g className='max-label-container' style={{ padding: '6px' }} markerStart='url(#arrow-max)'>
            <rect
              x={2}
              y={maxY - labelHeight / 2}
              width={labelWidth}
              height={labelHeight}
              rx='10'
              ry='10'
              fill='#292929'
            />
            <text x={(5 + labelWidth) / 2} y={maxY + paddingY / 2} textAnchor='middle' fontSize='12' fill='#F199EE'>
              {max <= 1e-5 ? max.toExponential(0) : formatPrice(max)}
            </text>
          </g>
        )}
      </g>
    </>
  )
}
