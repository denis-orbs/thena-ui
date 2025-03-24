import { brushY, select } from 'd3'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import usePrevious from '@/hooks/usePrevious'

import { brushHandleAccentPathV2, brushHandlePathV2, OffScreenHandleV2 } from './svg'

// flips the handles draggers when close to the container edges
const FLIP_HANDLE_THRESHOLD_PX = 20

// margin to prevent tick snapping from putting the brush off screen
const BRUSH_EXTENT_MARGIN_PX = 2

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
  width,
  height,
  northHandleColor,
  southHandleColor,
}) => {
  const t = useTranslations()
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

  // keep local and external brush extent in sync
  // i.e. snap to ticks on brush end
  useEffect(() => {
    setLocalBrushExtent(brushExtent)
  }, [brushExtent])

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
      .handleSize(30)
      .filter(() => interactive)
      .filter(event => {
        // Allow interactions only if the event target is part of the brush selection or handles
        const { target } = event
        return target.classList.contains('selection') || target.classList.contains('handle')
      })
      .on('brush', event => {
        const { selection } = event
        setBrushInProgress(true)

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
      })

    brushBehavior.current(select(brushRef.current))

    if (previousBrushExtent && compare(normalizedExtent, normalizeExtent(previousBrushExtent), yScale)) {
      select(brushRef.current).transition().call(brushBehavior.current.move, scaledExtent)
    }

    select(brushRef.current).selectAll('.overlay').attr('cursor', 'default')

    // brush linear gradient
    select(brushRef.current)
      .selectAll('.selection')
      .attr('stroke', 'none')
      .attr('fill-opacity', '0.1')
      .attr('fill', `url(#${id}-gradient-selection)`)
      .attr('cursor', 'grab')
  }, [brushExtent, id, height, interactive, previousBrushExtent, yScale, width, setBrushExtent, brushInProgress])

  // respond to yScale changes only
  useEffect(() => {
    if (!brushRef.current || !brushBehavior.current) return

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
  return useMemo(
    () => (
      <>
        <defs>
          <linearGradient id={`${id}-gradient-selection`} x1='0%' y1='100%' x2='100%' y2='100%'>
            <stop stopColor={northHandleColor} />
            <stop stopColor={northHandleColor} offset='1' />
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
                  flipNorthHandle ? '1' : '-1'
                })`}
                cursor={interactive ? 'ns-resize' : 'default'}
                pointerEvents='none'
              >
                <g>
                  <path color={southHandleColor} stroke={southHandleColor} opacity={0.6} d={brushHandlePathV2(width)} />
                  <path
                    color={southHandleColor}
                    stroke={southHandleColor}
                    strokeWidth={4}
                    strokeLinecap='round'
                    d={brushHandleAccentPathV2(width)}
                  />
                </g>
              </g>
            ) : null}

            {southHandleInView ? (
              <g
                transform={`translate(0, ${yScale(normalizedBrushExtent[0])}), scale(1, ${
                  flipSouthHandle ? '-1' : '1'
                })`}
                cursor={interactive ? 'ns-resize' : 'default'}
                pointerEvents='none'
              >
                <g>
                  <path color={southHandleColor} stroke={southHandleColor} opacity={0.6} d={brushHandlePathV2(width)} />
                  <path
                    color={southHandleColor}
                    stroke={southHandleColor}
                    strokeWidth={4}
                    strokeLinecap='round'
                    d={brushHandleAccentPathV2(width)}
                  />
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
                  {t('range.outOfView')}
                </text>
              </g>
            )}
            {showSouthArrow && (
              <g transform={`translate(18, ${height - 16}) `}>
                <OffScreenHandleV2 color={northHandleColor} />
                {!showNorthArrow && (
                  <text x={14} y={5} fill={northHandleColor} fontSize={10} alignmentBaseline='middle'>
                    {t('range.outOfView')}
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
      northHandleColor,
      southHandleColor,
      width,
      height,
      normalizedBrushExtent,
      northHandleInView,
      yScale,
      flipNorthHandle,
      interactive,
      southHandleInView,
      flipSouthHandle,
      showNorthArrow,
      t,
      showSouthArrow,
    ],
  )
}
// northHandleColor,
// southHandleColor,
