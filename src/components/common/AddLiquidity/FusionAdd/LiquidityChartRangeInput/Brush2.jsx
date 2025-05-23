import { brushY, select } from 'd3'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import usePrevious from '@/hooks/usePrevious'

import { brushHandlePathV2 } from './svg'

// flips the handles draggers when close to the container edges
const FLIP_HANDLE_THRESHOLD_PX = 36

// margin to prevent tick snapping from putting the brush off screen
const BRUSH_EXTENT_MARGIN_PX = 8

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

export const Brush2 = ({
  id,
  yScale,
  interactive,
  brushExtent,
  setBrushExtent,
  brushLabelValue,
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
  setCurrentHover = () => {},
}) => {
  const brushRef = useRef(null)
  const brushBehavior = useRef(null)

  const [localBrushExtent, setLocalBrushExtent] = useState(brushExtent)
  const previousBrushExtent = usePrevious(brushExtent)

  const [brushInProgress, setBrushInProgress] = useState(false)

  useEffect(() => {
    if (brushInProgress) return
    setLocalBrushExtent(brushExtent)
  }, [brushExtent, brushInProgress])

  useEffect(() => {
    setLiveLocalBrushExtent(localBrushExtent)
  }, [localBrushExtent, setLiveLocalBrushExtent])

  useEffect(() => {
    if (!brushRef.current || brushInProgress) return

    const normalizedExtent = normalizeExtent(brushExtent)
    const scaledExtent = toYScale(normalizedExtent, yScale)

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
        if (!compare(normalizedExtent, priceExtent, yScale)) {
          setBrushExtent(priceExtent, mode)
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
      compare(normalizedExtent, normalizeExtent(previousBrushExtent), yScale) &&
      !isNaN(scaledExtent[0]) &&
      !isNaN(scaledExtent[1])
    ) {
      select(brushRef.current).transition().call(brushBehavior.current.move, scaledExtent)
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

    const handleNorth = brushSelection.selectAll('.handle--n')
    const handleSouth = brushSelection.selectAll('.handle--s')

    handleNorth.on('mouseenter', () => setCurrentHover('north')).on('mouseleave', () => setCurrentHover(null))
    handleSouth.on('mouseenter', () => setCurrentHover('south')).on('mouseleave', () => setCurrentHover(null))

    return () => {
      handleNorth.on('mouseenter', null).on('mouseleave', null)
      handleSouth.on('mouseenter', null).on('mouseleave', null)
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
    setCurrentHover,
    container,
  ])

  // respond to yScale changes only
  useEffect(() => {
    if (!brushRef.current || !brushBehavior.current || !interactive) return
    const extent = toYScale(brushExtent, yScale)
    if (isNaN(extent[0]) || isNaN(extent[1])) return
    brushBehavior.current.move(select(brushRef.current), normalizeExtent(toYScale(brushExtent, yScale)))
  }, [brushExtent, interactive, yScale])

  const normalizedBrushExtent = normalizeExtent(localBrushExtent ?? brushExtent)

  const flipNorthHandle = yScale(normalizedBrushExtent[1]) < FLIP_HANDLE_THRESHOLD_PX
  const flipSouthHandle = yScale(normalizedBrushExtent[0]) > height - FLIP_HANDLE_THRESHOLD_PX

  const showNorthArrow =
    normalizedBrushExtent && (yScale(normalizedBrushExtent[0]) < 0 || yScale(normalizedBrushExtent[1]) < 0)
  const showSouthArrow =
    normalizedBrushExtent && (yScale(normalizedBrushExtent[0]) > height || yScale(normalizedBrushExtent[1]) > height)

  const southHandleInView =
    normalizedBrushExtent && yScale(normalizedBrushExtent[0]) >= 0 && yScale(normalizedBrushExtent[0]) <= height
  const northHandleInView =
    normalizedBrushExtent && yScale(normalizedBrushExtent[1]) >= 0 && yScale(normalizedBrushExtent[1]) <= height

  useEffect(() => {
    select(brushRef.current)
      .selectAll('.handle--n')
      .attr('transform', `translate(0, ${flipNorthHandle ? 10 : -10})`)
    select(brushRef.current)
      .selectAll('.handle--s')
      .attr('transform', `translate(0, ${flipSouthHandle ? -10 : 10})`)
  }, [flipNorthHandle, flipSouthHandle])

  useEffect(() => {
    if (showNorthArrow || showSouthArrow) {
      setIsOutOfView(true)
    } else {
      setIsOutOfView(false)
    }
  }, [setIsOutOfView, showNorthArrow, showSouthArrow])

  return useMemo(
    () => (
      <>
        <rect x='0' y={-padding} width='100%' height={padding} fill='#0D090F' />
        {(showNorthArrow || isFullRange) && <line x1='0' y1='0' x2={width} y2='0' stroke='#F199EE' strokeWidth='2' />}

        <rect x='0' y={height} width='100%' height={padding - 14} fill='#0D090F' />
        {(showSouthArrow || isFullRange) && (
          <line x1='0' y1={height} x2={width} y2={height} stroke='#F199EE' strokeWidth='2' />
        )}
        <defs>
          <linearGradient id={`${id}-gradient-selection`} x1='0%' x2='100%' y1='0%' y2='0%'>
            <stop offset='6.2%' stopColor='#BD60BA' stopOpacity={0.5} />
            <stop offset='100%' stopColor='#83007E' stopOpacity={0} />
          </linearGradient>

          {/* clips at exactly the svg area */}
          <clipPath id={`${id}-brush-clip`}>
            <rect x={0} y='0' width={width} height={height} />
          </clipPath>
        </defs>

        {/* will host the d3 brush */}
        <g
          ref={brushRef}
          clipPath={`url(#${id}-brush-clip)`}
          pointerEvents={interactive ? 'all' : 'none'}
          style={{ cursor: interactive ? 'default' : 'not-allowed' }}
        />

        {/* custom brush handles */}
        {normalizedBrushExtent && (
          <>
            {northHandleInView && !isFullRange ? (
              <g
                transform={`translate(0, ${Math.max(0, yScale(normalizedBrushExtent[1]))}), scale(1, ${
                  flipNorthHandle ? -1 : 1
                })`}
                cursor={interactive ? 'ns-resize' : 'default'}
                pointerEvents={interactive ? 'all' : 'none'}
                style={{ cursor: interactive ? 'ns-resize' : 'not-allowed' }}
              >
                <path
                  color={interactive ? southHandleColor : disableColor.line.south}
                  stroke={interactive ? southHandleColor : disableColor.line.south}
                  strokeWidth={2}
                  opacity={interactive ? 0.85 : 1}
                  d={brushHandlePathV2(width)}
                />
                <g pointerEvents='none' opacity={interactive ? 0.85 : 1}>
                  {' '}
                  <rect
                    x='0'
                    y='-36'
                    width='128'
                    height='36'
                    rx='10'
                    fill={interactive ? southHandleColor : disableColor.handle.south}
                  />
                  <rect
                    x='0'
                    y='-18'
                    width='128'
                    height='18'
                    fill={interactive ? southHandleColor : disableColor.handle.south}
                  />
                  {interactive && (
                    <g transform='translate(16, -26)' pointerEvents='none'>
                      <svg width='12' height='16' viewBox='0 0 12 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
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
                    x={interactive ? '80' : '60'}
                    y='-12'
                    fill={interactive ? '#2C002A' : '#B3ABB7'}
                    fontSize='20'
                    textAnchor='middle'
                    pointerEvents='none'
                    transform={`translate(80, ${flipNorthHandle ? -18 : -12}) rotate(${
                      flipNorthHandle ? 180 : 0
                    }) scale(${flipNorthHandle ? -1 : 1},1) translate(-80, ${flipNorthHandle ? 18 : 12})`}
                  >
                    {brushLabelValue('w', localBrushExtent?.[1])}
                  </text>
                </g>
              </g>
            ) : null}

            {southHandleInView && !isFullRange ? (
              <g
                transform={`translate(0, ${yScale(normalizedBrushExtent[0])}), scale(1, ${flipSouthHandle ? -1 : 1})`}
                cursor={interactive ? 'ns-resize' : 'default'}
                pointerEvents={interactive ? 'all' : 'none'}
                style={{ cursor: interactive ? 'ns-resize' : 'not-allowed' }}
              >
                <g>
                  <path
                    color={interactive ? southHandleColor : disableColor.line.south}
                    stroke={interactive ? southHandleColor : disableColor.line.south}
                    strokeWidth={2}
                    opacity={interactive ? 0.85 : 1}
                    d={brushHandlePathV2(width)}
                    id='south-line-handle-path'
                  />
                  <g pointerEvents='none' opacity={interactive ? 0.85 : 1}>
                    {' '}
                    <rect
                      x='0'
                      y='0'
                      width='128'
                      height='36'
                      rx='10'
                      fill={interactive ? southHandleColor : disableColor.handle.south}
                    />
                    <rect
                      x='0'
                      y='0'
                      width='128'
                      height='18'
                      fill={interactive ? southHandleColor : disableColor.handle.south}
                    />
                    {interactive && (
                      <g transform='translate(16, 9)' pointerEvents='none'>
                        <svg width='12' height='16' viewBox='0 0 12 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
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
                      x={interactive ? '80' : '60'}
                      y='23'
                      fill={interactive ? '#2C002A' : '#B3ABB7'}
                      fontSize='20'
                      textAnchor='middle'
                      pointerEvents='none'
                      transform={`translate(80, ${flipSouthHandle ? 16 : 23}) rotate(${
                        flipSouthHandle ? 180 : 0
                      }) scale(${flipSouthHandle ? -1 : 1},1) translate(-80, ${flipSouthHandle ? -16 : -23})`}
                    >
                      {brushLabelValue('w', localBrushExtent?.[0])}
                    </text>
                  </g>
                </g>
              </g>
            ) : null}

            {(showNorthArrow || isFullRange) && (
              <g transform='translate(18, -10) scale(1,-1)'>
                <svg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M11 1.5L6 6.5L1 1.5'
                    stroke='#F199EE'
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
                  color='#F199EE'
                >
                  range out of view
                </text>
              </g>
            )}
            {isFullRange && (
              <rect x='0' y='0' width={width} height={height} fill={`url(#${id}-gradient-selection)`} opacity={0.8} />
            )}
            {(showSouthArrow || isFullRange) && (
              <g transform={`translate(18, ${height + 10}) `}>
                <svg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M11 1.5L6 6.5L1 1.5'
                    stroke='#F199EE'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>

                <text
                  x={30}
                  y={5}
                  fill={northHandleColor}
                  fontSize={20}
                  fontWeight={600}
                  alignmentBaseline='middle'
                  fontFamily='Archia'
                  color='#F199EE'
                >
                  range out of view
                </text>
              </g>
            )}
          </>
        )}
      </>
    ),
    [
      padding,
      showNorthArrow,
      isFullRange,
      width,
      height,
      showSouthArrow,
      id,
      normalizedBrushExtent,
      northHandleInView,
      yScale,
      flipNorthHandle,
      interactive,
      southHandleColor,
      disableColor.line.south,
      disableColor.handle.south,
      brushLabelValue,
      localBrushExtent,
      southHandleInView,
      flipSouthHandle,
      northHandleColor,
    ],
  )
}
