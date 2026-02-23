import { brushY, select } from 'd3'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import usePrevious from '@/hooks/usePrevious'

import { AxisRight } from './AxisRight'

const useRAFCallback = callback => {
  const rafRef = useRef(null)
  const callbackRef = useRef(callback)

  callbackRef.current = callback

  return useCallback((...args) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      callbackRef.current(...args)
    })
  }, [])
}

// Throttled state setter
const useThrottledState = (initialValue, delay = 16) => {
  // ~60fps
  const [state, setState] = useState(initialValue)
  const timeoutRef = useRef(null)

  const setThrottledState = useCallback(
    newValue => {
      if (timeoutRef.current) return

      timeoutRef.current = setTimeout(() => {
        setState(newValue)
        timeoutRef.current = null
      }, delay)
    },
    [delay],
  )

  return [state, setThrottledState, setState]
}

export const DEFAULT_LOCALE = 'en-US'

const formatDelta = (delta, locale = DEFAULT_LOCALE) => {
  if (delta === null || delta === undefined || delta === Infinity || isNaN(delta)) {
    return '-'
  }

  return `${Number(Math.abs(delta).toFixed(2)).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  })}%`
}

const FLIP_HANDLE_THRESHOLD_PX = 36
const BRUSH_EXTENT_MARGIN_PX = 20

const compare = (a, b, yScale) => {
  const aNorm = a.map(y => yScale(y)?.toFixed(1))
  const bNorm = b.map(y => yScale(y)?.toFixed(1))
  return aNorm.every((v, i) => v === bNorm[i])
}

const toYScale = (extent, yScale) => [yScale(extent[1]), yScale(extent[0])]
const toPriceExtent = (selection, yScale) => [yScale.invert(selection[1]), yScale.invert(selection[0])]
const normalizeExtent = extent => (extent[0] < extent[1] ? extent : [extent[1], extent[0]])

const Brush2 = ({
  id,
  yScale,
  interactive,
  brushExtent,
  setBrushExtent,
  width,
  height,
  northHandleColor,
  southHandleColor,
  setIsOutOfView,
  isFullRange,
  padding,
  disableColor,
  divideDistanceWidth,
  currentPrice,
  handleShow,
  setIsFlip = () => {},
}) => {
  const { isLgDown } = useMediaQuery()
  const t = useTranslations()
  const brushRef = useRef(null)
  const brushBehavior = useRef(null)
  const [localBrushExtent, setLocalBrushExtent] = useState(brushExtent)
  const previousBrushExtent = usePrevious(brushExtent)
  const [brushInProgress, setBrushInProgress] = useState(false)

  // Use throttled state for hover
  const [currentHover, setCurrentHoverThrottled, setCurrentHover] = useThrottledState(null)

  const [animationStates, setAnimationStates] = useState({
    showNorthAnimated: false,
    showSouthAnimated: false,
  })

  // Only update localBrushExtent if brushInProgress is false and value actually changed
  useEffect(() => {
    if (brushInProgress) return
    setLocalBrushExtent(prev => {
      if (prev?.[0]?.toString() !== brushExtent?.[0]?.toString()) {
        return [brushExtent?.[0], prev?.[1]]
      }
      if (prev?.[1]?.toString() !== brushExtent?.[1]?.toString()) {
        return [prev?.[0], brushExtent?.[1]]
      }
      return prev
    })
  }, [brushExtent, brushInProgress])

  // Debounced setter for brush extent
  const debounceRef = useRef()
  const debouncedSetBrushExtent = useCallback(
    (priceExtent, mode) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setBrushExtent(priceExtent, mode)
      }, 50)
    },
    [setBrushExtent],
  )

  // Memoize expensive calculations with more dependencies
  const calculations = useMemo(() => {
    const normalizedBrushExtent = normalizeExtent(localBrushExtent ?? brushExtent)
    if (!normalizedBrushExtent) {
      return {
        normalizedBrushExtent: null,
        flipNorthHandle: false,
        flipSouthHandle: false,
        showNorthArrow: false,
        showSouthArrow: false,
        southHandleInView: false,
        northHandleInView: false,
      }
    }

    const northY = yScale(normalizedBrushExtent[1])
    const southY = yScale(normalizedBrushExtent[0])

    return {
      normalizedBrushExtent,
      flipNorthHandle: northY < FLIP_HANDLE_THRESHOLD_PX + 16,
      flipSouthHandle: southY > height - FLIP_HANDLE_THRESHOLD_PX,
      showNorthArrow: northY < 0 || yScale(normalizedBrushExtent[1]) < 0,
      showSouthArrow: southY > height || yScale(normalizedBrushExtent[0]) > height,
      southHandleInView: southY >= 0 && southY <= height,
      northHandleInView: northY >= 0 && northY <= height,
      northY,
      southY,
    }
  }, [localBrushExtent, brushExtent, yScale, height])

  // Throttled flip state update
  const throttledSetIsFlip = useRAFCallback(setIsFlip)

  useEffect(() => {
    if (brushInProgress) return
    if (calculations.flipNorthHandle || calculations.flipSouthHandle) {
      throttledSetIsFlip(true)
    } else {
      throttledSetIsFlip(false)
    }
  }, [brushInProgress, calculations.flipNorthHandle, calculations.flipSouthHandle, throttledSetIsFlip])

  // Throttled out-of-view state update
  const throttledSetIsOutOfView = useRAFCallback(setIsOutOfView)

  useEffect(() => {
    throttledSetIsOutOfView(calculations.showNorthArrow || calculations.showSouthArrow)
  }, [throttledSetIsOutOfView, calculations.showNorthArrow, calculations.showSouthArrow])

  // Memoize brush label calculation
  const brushLabelValue = useCallback(
    (d, x) => {
      if (!currentPrice || !x) return ''
      const percent =
        (x < currentPrice ? -1 : 1) * ((Math.max(x, currentPrice) - Math.min(x, currentPrice)) / currentPrice) * 100
      return `${(Math.sign(percent) < 0 ? '-' : '') + formatDelta(percent)}`
    },
    [currentPrice],
  )

  const handleBrushMouseMove = useCallback(
    e => {
      if (!calculations.normalizedBrushExtent || !brushRef.current) return

      const svgRect = brushRef.current.getBoundingClientRect()
      const mouseY = e.clientY - svgRect.top

      const hoverThreshold = 40
      const northDistance = calculations.northHandleInView ? Math.abs(mouseY - calculations.northY) : Infinity
      const southDistance = calculations.southHandleInView ? Math.abs(mouseY - calculations.southY) : Infinity

      let newHover = null

      if (northDistance < hoverThreshold && southDistance < hoverThreshold) {
        const diff = Math.abs(northDistance - southDistance)
        if (diff > 5) {
          newHover = northDistance < southDistance ? 'north' : 'south'
        } else {
          newHover = currentHover || (northDistance < southDistance ? 'north' : 'south')
        }
      } else if (northDistance < hoverThreshold) {
        newHover = 'north'
      } else if (southDistance < hoverThreshold) {
        newHover = 'south'
      }

      if (currentHover !== newHover) {
        setCurrentHoverThrottled(newHover) // Use throttled version
      }
    },
    [calculations, currentHover, setCurrentHoverThrottled],
  )

  const rafMouseMove = useRAFCallback(handleBrushMouseMove)

  // Throttled mouse leave handler
  const handleBrushMouseLeave = useCallback(() => {
    setCurrentHover(null)
  }, [setCurrentHover])

  const rafMouseLeave = useRAFCallback(handleBrushMouseLeave)

  // D3 brush setup
  useEffect(() => {
    if (!brushRef.current || brushInProgress) return

    // Only recreate brush behavior when necessary
    if (!brushBehavior.current) {
      brushBehavior.current = brushY()
        .extent([
          [0, BRUSH_EXTENT_MARGIN_PX],
          [width, height - BRUSH_EXTENT_MARGIN_PX],
        ])
        .handleSize(50)
    }

    brushBehavior.current
      .filter(() => interactive)
      .filter(event => {
        if (!interactive) return false
        const { target } = event
        return target.classList.contains('selection') || target.classList.contains('handle')
      })
      .on('brush', event => {
        if (!interactive) return
        const { selection } = event
        setBrushInProgress(true)
        select(brushRef.current).selectAll('.handle').attr('cursor', 'ns-resize')
        if (!selection) {
          setLocalBrushExtent(null)
          return
        }
        const priceExtent = normalizeExtent(toPriceExtent(selection, yScale))
        setLocalBrushExtent(priceExtent)
      })
      .on('end', event => {
        if (!interactive) return
        const { selection, mode } = event
        if (!selection) {
          setLocalBrushExtent(null)
          return
        }
        const priceExtent = normalizeExtent(toPriceExtent(selection, yScale))
        if (!compare(normalizeExtent(brushExtent), priceExtent, yScale)) {
          debouncedSetBrushExtent(priceExtent, mode)
        }
        setLocalBrushExtent(priceExtent)
        setBrushInProgress(false)
        select(brushRef.current).selectAll('.handle').style('cursor', 'pointer')
      })

    const brushSelection = select(brushRef.current)

    // Apply all styles at once
    brushSelection.selectAll('.handle').attr('cursor', interactive ? 'pointer' : 'default')

    brushSelection
      .selectAll('.overlay')
      .attr('cursor', 'default')
      .attr('pointer-events', interactive ? 'all' : 'none')

    brushSelection
      .selectAll('.selection')
      .attr('stroke', 'none')
      .attr('fill-opacity', '1')
      .attr('fill', `url(#${id}-gradient-selection)`)
      .attr('cursor', interactive ? 'grab' : 'default')
      .attr('pointer-events', interactive ? 'all' : 'none')

    brushSelection.selectAll('.handle--n').attr('pointer-events', interactive ? 'all' : 'none')
    brushSelection.selectAll('.handle--s').attr('pointer-events', interactive ? 'all' : 'none')

    brushBehavior.current(brushSelection)

    if (
      previousBrushExtent &&
      compare(normalizeExtent(brushExtent), normalizeExtent(previousBrushExtent), yScale) &&
      !isNaN(toYScale(normalizeExtent(brushExtent), yScale)[0]) &&
      !isNaN(toYScale(normalizeExtent(brushExtent), yScale)[1])
    ) {
      brushSelection.transition().call(brushBehavior.current.move, toYScale(normalizeExtent(brushExtent), yScale))
    }

    const brushNode = brushRef.current
    if (brushNode) {
      brushNode.addEventListener('mousemove', rafMouseMove)
      brushNode.addEventListener('mouseleave', rafMouseLeave)
    }

    return () => {
      if (brushNode) {
        brushNode.removeEventListener('mousemove', rafMouseMove)
        brushNode.removeEventListener('mouseleave', rafMouseLeave)
      }
    }
  }, [
    brushExtent,
    id,
    height,
    interactive,
    previousBrushExtent,
    yScale,
    width,
    setBrushExtent,
    brushInProgress,
    debouncedSetBrushExtent,
    rafMouseLeave,
    rafMouseMove,
  ])

  // Handle transforms (run only once)
  useEffect(() => {
    if (!brushRef.current) return
    select(brushRef.current).selectAll('.handle--n').attr('transform', 'translate(0, -15)')
    select(brushRef.current).selectAll('.handle--s').attr('transform', 'translate(0, 15)')
  }, [])

  const prevShowNorthArrow = useRef(false)
  const prevShowSouthArrow = useRef(false)
  const prevIsFullRange = useRef(false)

  useEffect(() => {
    const { showNorthArrow, showSouthArrow } = calculations
    const timeouts = []

    // Chỉ xử lý khi input thay đổi thật
    if (
      prevShowNorthArrow.current !== showNorthArrow ||
      prevShowSouthArrow.current !== showSouthArrow ||
      prevIsFullRange.current !== isFullRange
    ) {
      if (showNorthArrow || isFullRange) {
        timeouts.push(
          window.setTimeout(() => {
            setAnimationStates(prev => ({ ...prev, showNorthAnimated: true }))
          }, 200),
        )
      } else {
        setAnimationStates(prev => ({ ...prev, showNorthAnimated: false }))
      }

      if (showSouthArrow || isFullRange) {
        timeouts.push(
          window.setTimeout(() => {
            setAnimationStates(prev => ({ ...prev, showSouthAnimated: true }))
          }, 200),
        )
      } else {
        setAnimationStates(prev => ({ ...prev, showSouthAnimated: false }))
      }

      // update refs
      prevShowNorthArrow.current = showNorthArrow
      prevShowSouthArrow.current = showSouthArrow
      prevIsFullRange.current = isFullRange
    }
  }, [calculations, calculations.showNorthArrow, calculations.showSouthArrow, isFullRange])

  // Respond to yScale changes
  useEffect(() => {
    const brushBehaviorNode = brushBehavior.current
    if (!brushBehaviorNode || !interactive || !brushRef.current) return

    if (!brushExtent || !Array.isArray(brushExtent) || brushExtent.length !== 2) return

    const extent = toYScale(brushExtent, yScale)
    if (isNaN(extent[0]) || isNaN(extent[1])) return

    if (typeof brushBehaviorNode.move !== 'function') return

    try {
      const selection = select(brushRef.current)
      selection.call(brushBehaviorNode.move, normalizeExtent(extent))
    } catch (error) {
      console.warn('Brush move failed:', error)
    }

    if (!compare(normalizeExtent(brushExtent), normalizeExtent(toPriceExtent(extent, yScale)), yScale)) {
      debouncedSetBrushExtent(toPriceExtent(extent, yScale))
    }
  }, [brushExtent, debouncedSetBrushExtent, interactive, yScale])

  return useMemo(
    () => (
      <>
        {handleShow && (
          <>
            {(calculations.showNorthArrow || isFullRange) && (
              <line x1='0' y1='15' x2={width} y2='15' stroke={interactive ? '#F199EE' : '#35243D'} strokeWidth='2' />
            )}
            {(calculations.showSouthArrow || isFullRange) && (
              <line
                x1='0'
                y1={height}
                x2={width}
                y2={height}
                stroke={interactive ? '#F199EE' : '#35243D'}
                strokeWidth='2'
              />
            )}
            <defs>
              {isLgDown ? (
                <linearGradient id={`${id}-gradient-selection`} x1='0%' x2='100%' y1='0%' y2='0%'>
                  <stop offset='6.2%' stopColor='#BD60BA' stopOpacity={0} />
                  <stop offset='100%' stopColor='#83007E' stopOpacity={0.1} />
                </linearGradient>
              ) : (
                <linearGradient id={`${id}-gradient-selection`} x1='0%' x2='100%' y1='0%' y2='0%'>
                  <stop offset='6.2%' stopColor='#BD60BA' stopOpacity={0.5} />
                  <stop offset='100%' stopColor='#83007E' stopOpacity={0} />
                </linearGradient>
              )}
              <clipPath id={`${id}-brush-clip`}>
                <rect x={0} y='0' width={width} height={height} />
              </clipPath>
            </defs>
            <g
              ref={brushRef}
              clipPath={`url(#${id}-brush-clip)`}
              pointerEvents={interactive ? 'all' : 'none'}
              style={{ cursor: interactive ? 'default' : 'not-allowed' }}
            />
            {calculations.normalizedBrushExtent && (
              <>
                {calculations.northHandleInView && !isFullRange && (
                  <g>
                    <line
                      x1='0'
                      y1={Math.max(0, calculations.northY)}
                      x2={width}
                      y2={Math.max(0, calculations.northY)}
                      stroke={interactive ? '#EA66E5' : '#685770'}
                      strokeWidth={isLgDown ? 1 : 2}
                    />
                    <g
                      pointerEvents='none'
                      cursor={interactive ? 'ns-resize' : 'default'}
                      style={{ cursor: interactive ? 'ns-resize' : 'not-allowed' }}
                      transform={`translate(${(width - (currentHover === 'north' ? 106 : isLgDown ? 32 : 52)) / 2}, ${
                        Math.max(0, calculations.northY) -
                        (currentHover === 'north'
                          ? calculations.flipNorthHandle
                            ? -8
                            : 35
                          : calculations.flipNorthHandle
                            ? -8
                            : 15)
                      })`}
                    >
                      {currentHover === 'north' ? (
                        <g pointerEvents='none' opacity={1}>
                          <rect
                            x='0'
                            y='1'
                            width='106'
                            height='28'
                            rx='8'
                            fill={interactive ? northHandleColor : disableColor.handle.north}
                            stroke={interactive ? '#F199EE' : disableColor.line.north}
                            strokeWidth='1'
                          />
                          {interactive && (
                            <g transform='translate(8, 7)' pointerEvents='none'>
                              <svg
                                width='11'
                                height='16'
                                viewBox='0 0 11 16'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                              >
                                <path
                                  d='M1.83331 10.5001L5.99998 14.6668L10.1666 10.5001M1.83331 5.50009L5.99998 1.33342L10.1666 5.50009'
                                  stroke='#2C002A'
                                  strokeWidth='2'
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                />
                              </svg>
                            </g>
                          )}
                          <text
                            className='font-archia font-semibold'
                            x={interactive ? '27' : '20'}
                            y='22'
                            fill={interactive ? '#2C002A' : '#B3ABB7'}
                            fontSize='20'
                            textAnchor='start'
                            pointerEvents='none'
                          >
                            {brushLabelValue('w', localBrushExtent?.[1])}
                          </text>
                        </g>
                      ) : (
                        <rect
                          width={isLgDown ? 32 : 52}
                          height={8}
                          fill={interactive ? '#F199EE' : '#35243D'}
                          stroke={interactive ? '#EA66E5' : '#685770'}
                          strokeWidth='1'
                          rx='4'
                          ry='4'
                        />
                      )}
                    </g>
                  </g>
                )}

                {calculations.southHandleInView && !isFullRange && (
                  <g>
                    <line
                      x1='0'
                      y1={Math.max(0, calculations.southY)}
                      x2={width}
                      y2={Math.max(0, calculations.southY)}
                      stroke={interactive ? '#EA66E5' : '#685770'}
                      strokeWidth={isLgDown ? 1 : 2}
                    />
                    <g
                      pointerEvents='none'
                      cursor={interactive ? 'ns-resize' : 'default'}
                      style={{ cursor: interactive ? 'ns-resize' : 'not-allowed' }}
                      transform={`translate(${(width - (currentHover === 'south' ? 106 : isLgDown ? 32 : 52)) / 2}, ${
                        Math.max(0, calculations.southY) +
                        (currentHover === 'south'
                          ? calculations.flipSouthHandle
                            ? -35
                            : 8
                          : calculations.flipSouthHandle
                            ? -15
                            : 8)
                      })`}
                    >
                      {currentHover === 'south' ? (
                        <g pointerEvents='none' opacity={1}>
                          <rect
                            x='0'
                            y='1'
                            width='106'
                            height='28'
                            rx='8'
                            fill={interactive ? southHandleColor : disableColor.handle.south}
                            stroke={interactive ? '#F199EE' : disableColor.line.south}
                            strokeWidth='1'
                          />
                          {interactive && (
                            <g transform='translate(8, 7)' pointerEvents='none'>
                              <svg
                                width='11'
                                height='16'
                                viewBox='0 0 11 16'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                              >
                                <path
                                  d='M1.83331 10.5001L5.99998 14.6668L10.1666 10.5001M1.83331 5.50009L5.99998 1.33342L10.1666 5.50009'
                                  stroke='#2C002A'
                                  strokeWidth='2'
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                />
                              </svg>
                            </g>
                          )}
                          <text
                            className='font-archia font-semibold'
                            x={interactive ? '27' : '20'}
                            y='22'
                            fill={interactive ? '#2C002A' : '#B3ABB7'}
                            fontSize='20'
                            textAnchor='start'
                            pointerEvents='none'
                          >
                            {brushLabelValue('w', localBrushExtent?.[0])}
                          </text>
                        </g>
                      ) : (
                        <rect
                          width={isLgDown ? 32 : 52}
                          height={8}
                          fill={interactive ? '#F199EE' : '#35243D'}
                          stroke={interactive ? '#EA66E5' : '#685770'}
                          strokeWidth='1'
                          rx='4'
                          ry='4'
                        />
                      )}
                    </g>
                  </g>
                )}

                {(calculations.showNorthArrow || isFullRange) && (
                  <g
                    transform='translate(18, 30) scale(1,-1)'
                    style={{ opacity: animationStates.showNorthAnimated ? 1 : 0, transition: 'opacity 0.5s' }}
                  >
                    <svg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'>
                      <path
                        d='M11 1.5L6 6.5L1 1.5'
                        stroke={interactive ? '#F199EE' : '#35243D'}
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    <text
                      x={30}
                      y={-3}
                      fill={northHandleColor}
                      fontSize={20}
                      fontWeight={600}
                      alignmentBaseline='middle'
                      fontFamily='Archia'
                      transform='scale(1,-1)'
                      color={interactive ? '#F199EE' : '#35243D'}
                    >
                      {t(isFullRange ? 'Full Range' : 'range out of view')}
                    </text>
                  </g>
                )}
                {isFullRange && (
                  <rect
                    x='0'
                    y='0'
                    width={width}
                    height={height}
                    fill={`url(#${id}-gradient-selection)`}
                    opacity={0.8}
                  />
                )}
                {(calculations.showSouthArrow || isFullRange) && (
                  <g
                    transform={`translate(18, ${height - 15}) `}
                    style={{ opacity: animationStates.showSouthAnimated ? 1 : 0, transition: 'opacity 0.5s' }}
                  >
                    <svg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'>
                      <path
                        d='M11 1.5L6 6.5L1 1.5'
                        stroke={interactive ? '#F199EE' : '#35243D'}
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    <text
                      x={30}
                      y={2}
                      fill={northHandleColor}
                      fontSize={20}
                      fontWeight={600}
                      alignmentBaseline='middle'
                      fontFamily='Archia'
                      color={interactive ? '#F199EE' : '#35243D'}
                    >
                      {t(isFullRange ? 'Full Range' : 'range out of view')}
                    </text>
                  </g>
                )}
                {!isLgDown && (
                  <g width={divideDistanceWidth} transform={`translate(18, ${height + 10}) `}>
                    {Array.from({ length: Math.floor(divideDistanceWidth / 40) + 1 }).map((_, i) => (
                      <line
                        key={i}
                        x1={i * 40}
                        y1={0}
                        x2={i * 40}
                        y2={-10}
                        stroke='#4B3950'
                        strokeWidth='3'
                        opacity='0.4'
                      />
                    ))}
                  </g>
                )}

                <g transform={`translate(0, ${height + 20}) `}>
                  <line x1='0' y1={5} x2={width} y2={5} stroke='#281B2E' strokeWidth='3' />
                </g>
              </>
            )}
          </>
        )}
        <AxisRight
          yScale={yScale}
          offset={width - (isLgDown ? 60 : -5)}
          current={currentPrice}
          min={localBrushExtent?.[0]}
          max={localBrushExtent?.[1]}
          currentHover={currentHover}
          padding={padding}
          height={height}
          interactive={interactive}
        />
      </>
    ),
    [
      handleShow,
      calculations,
      isFullRange,
      width,
      height,
      interactive,
      isLgDown,
      id,
      northHandleColor,
      southHandleColor,
      disableColor,
      currentHover,
      brushLabelValue,
      localBrushExtent,
      animationStates,
      t,
      divideDistanceWidth,
      currentPrice,
      padding,
      yScale,
    ],
  )
}

export default Brush2
