import { brushY, select } from 'd3'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import usePrevious from '@/hooks/usePrevious'

import { AxisRight } from './AxisRight'

export const DEFAULT_LOCALE = 'en-US'
// Used to format floats representing percent change with fixed decimal places
function formatDelta(delta, locale = DEFAULT_LOCALE) {
  if (delta === null || delta === undefined || delta === Infinity || isNaN(delta)) {
    return '-'
  }

  return `${Number(Math.abs(delta).toFixed(2)).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  })}%`
}

// flips the handles draggers when close to the container edges
const FLIP_HANDLE_THRESHOLD_PX = 36

// margin to prevent tick snapping from putting the brush off screen
const BRUSH_EXTENT_MARGIN_PX = 20

/**
 * Returns true if every element in `a` maps to the
 * same pixel coordinate as elements in `b`
 */
const compare = (a, b, yScale) => {
  // normalize pixels to 1 decimals
  const aNorm = a.map(y => yScale(y)?.toFixed(1))
  const bNorm = b.map(y => yScale(y)?.toFixed(1))
  return aNorm.every((v, i) => v === bNorm[i])
}
// Convert [minPrice, maxPrice] to [yMax, yMin]
const toYScale = (extent, yScale) => [yScale(extent[1]), yScale(extent[0])]

// Convert [yMax, yMin] to [minPrice, maxPrice]
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
  container,
  disableColor,
  setLiveLocalBrushExtent = () => {},
  divideDistanceWidth,
  currentPrice,
  handleShow,
}) => {
  const { isLgDown } = useMediaQuery()
  const t = useTranslations()
  const brushRef = useRef(null)
  const brushBehavior = useRef(null)
  const [localBrushExtent, setLocalBrushExtent] = useState(brushExtent)
  const previousBrushExtent = usePrevious(brushExtent)
  const [brushInProgress, setBrushInProgress] = useState(false)
  // Use ref for hover to avoid re-rendering the whole component
  const currentHoverRef = useRef(null)
  const [, setHoverTick] = useState(0) // dummy state to force update on hover

  // Animation state for north/south out-of-view
  const [showNorthAnimated, setShowNorthAnimated] = useState(false)
  const [showSouthAnimated, setShowSouthAnimated] = useState(false)

  // Only update localBrushExtent if brushInProgress is false and value actually changed
  useEffect(() => {
    if (brushInProgress) return
    if (localBrushExtent !== brushExtent) setLocalBrushExtent(brushExtent)
  }, [brushExtent, brushInProgress, localBrushExtent])

  // Only update live local brush extent if changed
  useEffect(() => {
    setLiveLocalBrushExtent(localBrushExtent)
  }, [localBrushExtent, setLiveLocalBrushExtent])

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

  // Memoize normalized extent and derived values
  const normalizedBrushExtent = useMemo(
    () => normalizeExtent(localBrushExtent ?? brushExtent),
    [localBrushExtent, brushExtent],
  )
  const flipNorthHandle = useMemo(
    () => yScale(normalizedBrushExtent[1]) < FLIP_HANDLE_THRESHOLD_PX,
    [normalizedBrushExtent, yScale],
  )
  const flipSouthHandle = useMemo(
    () => yScale(normalizedBrushExtent[0]) > height - FLIP_HANDLE_THRESHOLD_PX,
    [normalizedBrushExtent, yScale, height],
  )
  const showNorthArrow = useMemo(
    () => normalizedBrushExtent && (yScale(normalizedBrushExtent[0]) < 0 || yScale(normalizedBrushExtent[1]) < 0),
    [normalizedBrushExtent, yScale],
  )
  const showSouthArrow = useMemo(
    () =>
      normalizedBrushExtent && (yScale(normalizedBrushExtent[0]) > height || yScale(normalizedBrushExtent[1]) > height),
    [normalizedBrushExtent, yScale, height],
  )
  const southHandleInView = useMemo(
    () => normalizedBrushExtent && yScale(normalizedBrushExtent[0]) >= 0 && yScale(normalizedBrushExtent[0]) <= height,
    [normalizedBrushExtent, yScale, height],
  )
  const northHandleInView = useMemo(
    () => normalizedBrushExtent && yScale(normalizedBrushExtent[1]) >= 0 && yScale(normalizedBrushExtent[1]) <= height,
    [normalizedBrushExtent, yScale, height],
  )

  // Only update out-of-view state if changed
  useEffect(() => {
    setIsOutOfView(showNorthArrow || showSouthArrow)
  }, [setIsOutOfView, showNorthArrow, showSouthArrow])

  // Memoize brush label value
  const brushLabelValue = useCallback(
    (d, x) => {
      if (!currentPrice) return ''
      const percent =
        (x < currentPrice ? -1 : 1) * ((Math.max(x, currentPrice) - Math.min(x, currentPrice)) / currentPrice) * 100
      return currentPrice ? `${(Math.sign(percent) < 0 ? '-' : '') + formatDelta(percent)}` : ''
    },
    [currentPrice],
  )

  // D3 brush setup
  useEffect(() => {
    if (!brushRef.current || brushInProgress) return
    brushBehavior.current = brushY()
      .extent([
        [0, BRUSH_EXTENT_MARGIN_PX],
        [width, height - BRUSH_EXTENT_MARGIN_PX],
      ])
      .handleSize(50)
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

    select(brushRef.current)
      .selectAll('.handle')
      .attr('cursor', interactive ? 'pointer' : 'default')
    brushBehavior.current(select(brushRef.current))

    if (
      previousBrushExtent &&
      compare(normalizeExtent(brushExtent), normalizeExtent(previousBrushExtent), yScale) &&
      !isNaN(toYScale(normalizeExtent(brushExtent), yScale)[0]) &&
      !isNaN(toYScale(normalizeExtent(brushExtent), yScale)[1])
    ) {
      select(brushRef.current)
        .transition()
        .call(brushBehavior.current.move, toYScale(normalizeExtent(brushExtent), yScale))
    }

    select(brushRef.current)
      .selectAll('.overlay')
      .attr('cursor', 'default')
      .attr('pointer-events', interactive ? 'all' : 'none')

    select(brushRef.current)
      .selectAll('.selection')
      .attr('stroke', 'none')
      .attr('fill-opacity', '1')
      .attr('fill', `url(#${id}-gradient-selection)`)
      .attr('cursor', interactive ? 'grab' : 'default')
      .attr('pointer-events', interactive ? 'all' : 'none')

    const brushSelection = select(brushRef.current)
    brushSelection.selectAll('.handle--n').attr('pointer-events', interactive ? 'all' : 'none')
    brushSelection.selectAll('.handle--s').attr('pointer-events', interactive ? 'all' : 'none')

    // Improved hover handling with better detection
    function handleBrushMouseMove(e) {
      if (!interactive || !normalizedBrushExtent) return

      const svgRect = brushRef.current.getBoundingClientRect()
      const mouseY = e.clientY - svgRect.top
      const northY = yScale(normalizedBrushExtent[1])
      const southY = yScale(normalizedBrushExtent[0])

      // Increase threshold and add better detection logic
      const hoverThreshold = 30
      const northDistance = northHandleInView ? Math.abs(mouseY - northY) : Infinity
      const southDistance = southHandleInView ? Math.abs(mouseY - southY) : Infinity

      let newHover = null

      // Determine which handle is closer and within threshold
      if (northDistance < hoverThreshold && southDistance < hoverThreshold) {
        // Both are close, choose the closer one
        newHover = northDistance < southDistance ? 'north' : 'south'
      } else if (northDistance < hoverThreshold) {
        newHover = 'north'
      } else if (southDistance < hoverThreshold) {
        newHover = 'south'
      }

      // Only update if hover state actually changed
      if (currentHoverRef.current !== newHover) {
        currentHoverRef.current = newHover
        setHoverTick(tick => tick + 1)
      }
    }

    function handleBrushMouseLeave() {
      if (currentHoverRef.current !== null) {
        currentHoverRef.current = null
        setHoverTick(tick => tick + 1)
      }
    }

    const brushNode = brushRef.current
    brushNode.addEventListener('mousemove', handleBrushMouseMove)
    brushNode.addEventListener('mouseleave', handleBrushMouseLeave)

    return () => {
      brushNode.removeEventListener('mousemove', handleBrushMouseMove)
      brushNode.removeEventListener('mouseleave', handleBrushMouseLeave)
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
    container,
    brushInProgress,
    debouncedSetBrushExtent,
    normalizedBrushExtent,
    northHandleInView,
    southHandleInView,
  ])

  // Only run once for handle transform
  useEffect(() => {
    select(brushRef.current).selectAll('.handle--n').attr('transform', 'translate(0, -15)')
    select(brushRef.current).selectAll('.handle--s').attr('transform', 'translate(0, 15)')
  }, [])

  useEffect(() => {
    if (showNorthArrow || showSouthArrow) {
      setIsOutOfView(true)
    } else {
      setIsOutOfView(false)
    }
  }, [setIsOutOfView, showNorthArrow, showSouthArrow])

  useEffect(() => {
    let northTimeout
    let southTimeout
    if (showNorthArrow || isFullRange) {
      northTimeout = setTimeout(() => setShowNorthAnimated(true), 200)
    } else {
      setShowNorthAnimated(false)
    }
    if (showSouthArrow || isFullRange) {
      southTimeout = setTimeout(() => setShowSouthAnimated(true), 200)
    } else {
      setShowSouthAnimated(false)
    }
    return () => {
      clearTimeout(northTimeout)
      clearTimeout(southTimeout)
    }
  }, [showNorthArrow, showSouthArrow, isFullRange])

  // respond to yScale changes only
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
  }, [brushExtent, interactive, yScale])

  return useMemo(
    () => (
      <>
        {handleShow && (
          <>
            {(showNorthArrow || isFullRange) && (
              <line x1='0' y1='15' x2={width} y2='15' stroke={interactive ? '#F199EE' : '#35243D'} strokeWidth='2' />
            )}
            {(showSouthArrow || isFullRange) && (
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
                <>
                  <linearGradient id={`${id}-gradient-selection`} x1='0%' x2='100%' y1='0%' y2='0%'>
                    <stop offset='6.2%' stopColor='#BD60BA' stopOpacity={0} />
                    <stop offset='100%' stopColor='#83007E' stopOpacity={0.1} />
                  </linearGradient>
                </>
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
            {normalizedBrushExtent && (
              <>
                {northHandleInView && !isFullRange ? (
                  <g>
                    <line
                      x1='0'
                      y1={Math.max(0, yScale(normalizedBrushExtent[1]))}
                      x2={width + 15}
                      y2={Math.max(0, yScale(normalizedBrushExtent[1]))}
                      stroke={interactive ? '#EA66E5' : '#685770'}
                      strokeWidth={isLgDown ? 1 : 2}
                    />
                    <g
                      pointerEvents='none'
                      cursor={interactive ? 'ns-resize' : 'default'}
                      style={{ cursor: interactive ? 'ns-resize' : 'not-allowed' }}
                      transform={`translate(${
                        (width - (currentHoverRef.current === 'north' ? 106 : isLgDown ? 32 : 52)) / 2
                      }, ${
                        Math.max(0, yScale(normalizedBrushExtent[1])) -
                        (currentHoverRef.current === 'north' ? (flipNorthHandle ? -8 : 35) : flipNorthHandle ? -8 : 15)
                      })`}
                    >
                      {currentHoverRef.current === 'north' ? (
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
                ) : null}

                {southHandleInView && !isFullRange ? (
                  <g>
                    <line
                      x1='0'
                      y1={Math.max(0, yScale(normalizedBrushExtent[0]))}
                      x2={width + 15}
                      y2={Math.max(0, yScale(normalizedBrushExtent[0]))}
                      stroke={interactive ? '#EA66E5' : '#685770'}
                      strokeWidth={isLgDown ? 1 : 2}
                    />
                    <g
                      pointerEvents='none'
                      cursor={interactive ? 'ns-resize' : 'default'}
                      style={{ cursor: interactive ? 'ns-resize' : 'not-allowed' }}
                      transform={`translate(${
                        (width - (currentHoverRef.current === 'south' ? 106 : isLgDown ? 32 : 52)) / 2
                      }, ${
                        Math.max(0, yScale(normalizedBrushExtent[0])) +
                        (currentHoverRef.current === 'south' ? (flipSouthHandle ? -35 : 8) : flipSouthHandle ? -15 : 8)
                      })`}
                    >
                      {currentHoverRef.current === 'south' ? (
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
                ) : null}

                {(showNorthArrow || isFullRange) && (
                  <g
                    transform='translate(18, 30) scale(1,-1)'
                    style={{ opacity: showNorthAnimated ? 1 : 0, transition: 'opacity 0.5s' }}
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
                      {t('range out of view')}
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
                {showSouthAnimated && (
                  <g
                    transform={`translate(18, ${height - 15}) `}
                    style={{ opacity: showSouthAnimated ? 1 : 0, transition: 'opacity 0.5s' }}
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
                      {t('range out of view')}
                    </text>
                  </g>
                )}
                {!showSouthAnimated && !isLgDown && (
                  <g width={divideDistanceWidth} transform={`translate(18, ${height + 10}) `}>
                    {/* Tick lines for bottom axis */}
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
          offset={width - (isLgDown ? 60 : 10)}
          current={currentPrice}
          min={localBrushExtent?.[0]}
          max={localBrushExtent?.[1]}
          currentHover={currentHoverRef.current}
          padding={padding}
          height={height}
          interactive={interactive}
        />
      </>
    ),
    [
      handleShow,
      showNorthArrow,
      isFullRange,
      width,
      showSouthArrow,
      height,
      isLgDown,
      id,
      interactive,
      normalizedBrushExtent,
      northHandleInView,
      yScale,
      flipNorthHandle,
      northHandleColor,
      disableColor.handle.north,
      disableColor.handle.south,
      disableColor.line.north,
      disableColor.line.south,
      brushLabelValue,
      localBrushExtent,
      southHandleInView,
      flipSouthHandle,
      southHandleColor,
      showNorthAnimated,
      t,
      showSouthAnimated,
      divideDistanceWidth,
      currentPrice,
      padding,
    ],
  )
}

export default Brush2
