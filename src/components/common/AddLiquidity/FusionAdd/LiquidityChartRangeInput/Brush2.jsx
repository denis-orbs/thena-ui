import { brushY, select } from 'd3'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import usePrevious from '@/hooks/usePrevious'

import { brushHandlePathV2, OffScreenHandleV2 } from './svg'

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
}) => {
  const brushRef = useRef(null)
  const brushBehavior = useRef(null)

  // only used to drag the handles on brush for performance
  const [localBrushExtent, setLocalBrushExtent] = useState(brushExtent)

  const previousBrushExtent = usePrevious(brushExtent)

  // keep local and external brush extent in sync
  // i.e. snap to ticks on brush end
  const [brushInProgress, setBrushInProgress] = useState(false)
  useEffect(() => {
    if (brushInProgress) {
      return
    }
    setLocalBrushExtent(brushExtent)
  }, [brushExtent, brushInProgress])

  // // keep local and external brush extent in sync
  // // i.e. snap to ticks on brush end
  // useEffect(() => {
  //   setLocalBrushExtent(brushExtent)
  // }, [brushExtent])

  useEffect(() => {
    if (!brushRef.current || brushInProgress) {
      return
    }

    const normalizedExtent = normalizeExtent(brushExtent)
    const scaledExtent = toYScale(normalizedExtent, yScale)

    brushBehavior.current = brushY()
      .extent([
        // x0, y0 (top left)
        [0, BRUSH_EXTENT_MARGIN_PX],
        // x1, y1 (bottom right)
        [width, height - BRUSH_EXTENT_MARGIN_PX],
      ])
      .handleSize(50)
      .filter(() => interactive)
      .filter(event => {
        // Allow interactions only if the event target is part of the brush selection or handles
        const { target } = event
        return target.classList.contains('selection') || target.classList.contains('handle')
      })
      .on('brush', event => {
        const { selection } = event
        setBrushInProgress(true)
        select(brushRef.current).selectAll('.handle').attr('cursor', 'ns-resize')
        if (!selection) {
          setLocalBrushExtent(null)
          return
        }

        // Update only the local extent during dragging
        const priceExtent = normalizeExtent(toPriceExtent(selection, yScale))
        setLocalBrushExtent(priceExtent)
      })
      .on('end', event => {
        const { selection, mode } = event

        if (!selection) {
          setLocalBrushExtent(null)
          return
        }

        // Finalize state update on end
        const priceExtent = normalizeExtent(toPriceExtent(selection, yScale))
        if (!compare(normalizedExtent, priceExtent, yScale)) {
          setBrushExtent(priceExtent, mode)
        }
        setLocalBrushExtent(priceExtent)
        setBrushInProgress(false)
        select(brushRef.current).selectAll('.handle').style('cursor', 'pointer')
      })
    select(brushRef.current).selectAll('.handle').attr('cursor', 'pointer')

    brushBehavior.current(select(brushRef.current))

    if (
      previousBrushExtent &&
      compare(normalizedExtent, normalizeExtent(previousBrushExtent), yScale) &&
      !isNaN(scaledExtent[0]) &&
      !isNaN(scaledExtent[1])
    ) {
      select(brushRef.current).transition().call(brushBehavior.current.move, scaledExtent)
    }

    select(brushRef.current).selectAll('.overlay').attr('cursor', 'default')
    // brush linear gradient
    select(brushRef.current)
      .selectAll('.selection')
      .attr('stroke', 'none')
      .attr('fill-opacity', '1')
      .attr('fill', `url(#${id}-gradient-selection)`)
      .attr('cursor', 'grab')
  }, [brushExtent, id, height, interactive, previousBrushExtent, yScale, width, setBrushExtent, brushInProgress])

  // respond to yScale changes only
  useEffect(() => {
    if (!brushRef.current || !brushBehavior.current) return

    const extent = toYScale(brushExtent, yScale)
    if (isNaN(extent[0]) || isNaN(extent[1])) return

    brushBehavior.current.move(select(brushRef.current), normalizeExtent(toYScale(brushExtent, yScale)))
  }, [brushExtent, yScale])

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
  }, [flipNorthHandle, flipSouthHandle, setIsOutOfView])

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
        <g ref={brushRef} clipPath={`url(#${id}-brush-clip)`} />

        {/* custom brush handles */}
        {normalizedBrushExtent && (
          <>
            {northHandleInView ? (
              <g
                transform={`translate(0, ${Math.max(0, yScale(normalizedBrushExtent[1]))}), scale(1, ${
                  flipNorthHandle ? -1 : 1
                })`}
                cursor={interactive ? 'ns-resize' : 'default'}
                pointerEvents='none'
              >
                <path
                  color={southHandleColor}
                  stroke={southHandleColor}
                  strokeWidth={2}
                  opacity={1}
                  d={brushHandlePathV2(width)}
                />
                <g pointerEvents='none' opacity={0.85}>
                  <rect x='0' y='-36' width='128' height='36' rx='10' fill='#F199EE' />
                  <rect x='0' y='-18' width='128' height='18' fill='#F199EE' />

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
                  <text
                    className='font-archia font-semibold'
                    x='80'
                    y='-12'
                    fill='#2C002A'
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

            {southHandleInView ? (
              <g
                transform={`translate(0, ${yScale(normalizedBrushExtent[0])}), scale(1, ${flipSouthHandle ? -1 : 1})`}
                cursor={interactive ? 'ns-resize' : 'default'}
                pointerEvents='none'
              >
                <g>
                  <path
                    color={southHandleColor}
                    stroke={southHandleColor}
                    strokeWidth={2}
                    opacity={1}
                    d={brushHandlePathV2(width)}
                    id='south-line-handle-path'
                  />
                  <g pointerEvents='none' opacity={0.85}>
                    <rect x='0' y='0' width='128' height='36' rx='10' fill='#F199EE' />
                    <rect x='0' y='0' width='128' height='18' fill='#F199EE' />
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
                    <text
                      className='font-archia font-semibold'
                      x='80'
                      y='23'
                      fill='#2C002A'
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

            {showNorthArrow && (
              <g transform='translate(18, 16) scale(1,-1)'>
                <OffScreenHandleV2 color={northHandleColor} />
                <text
                  x={14}
                  y={-3}
                  fill={northHandleColor}
                  fontSize={10}
                  alignmentBaseline='middle'
                  transform='scale(1,-1)'
                >
                  Range out of view
                </text>
              </g>
            )}
            {showSouthArrow && (
              <g transform={`translate(18, ${height - 16}) `}>
                <OffScreenHandleV2 color={northHandleColor} />
                {!showNorthArrow && (
                  <text x={14} y={5} fill={northHandleColor} fontSize={10} alignmentBaseline='middle'>
                    Range out of view
                  </text>
                )}
              </g>
            )}
          </>
        )}
      </>
    ),
    [
      id,
      width,
      height,
      normalizedBrushExtent,
      northHandleInView,
      yScale,
      flipNorthHandle,
      interactive,
      southHandleColor,
      brushLabelValue,
      localBrushExtent,
      southHandleInView,
      flipSouthHandle,
      showNorthArrow,
      northHandleColor,
      showSouthArrow,
    ],
  )
}
