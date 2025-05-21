import { select, zoom } from 'd3'
import React, { useEffect, useMemo, useRef } from 'react'

import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { ZoomInIcon, ZoomOutIcon } from '@/svgs'

export default function Zoom({ svg, xScale, setZoom, width, height, zoomLevels }) {
  const zoomBehavior = useRef()

  const [zoomIn, zoomOut, zoomInitial] = useMemo(
    () => [
      () => svg && zoomBehavior.current && select(svg).transition().call(zoomBehavior.current.scaleBy, 2),
      () => svg && zoomBehavior.current && select(svg).transition().call(zoomBehavior.current.scaleBy, 0.5),
      () => svg && zoomBehavior.current && select(svg).transition().call(zoomBehavior.current.scaleTo, 1),
    ],
    [svg],
  )

  useEffect(() => {
    if (!svg) return

    zoomBehavior.current = zoom()
      .scaleExtent([zoomLevels.min, zoomLevels.max])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', ({ transform }) => setZoom(transform))

    select(svg).call(zoomBehavior.current)
  }, [height, width, setZoom, svg, xScale, zoomBehavior, zoomLevels, zoomLevels.max, zoomLevels.min])

  useEffect(() => {
    // reset zoom to initial on zoomLevel change
    zoomInitial()
  }, [zoomInitial, zoomLevels])

  return (
    <div className='flex justify-end gap-2 md:-top-5'>
      <EmphasisIconButton
        className='lg:size-8'
        classNames='lg:size-4 stroke-neutral-400'
        Icon={ZoomInIcon}
        onClick={zoomIn}
        disabled={false}
      />
      <EmphasisIconButton
        className='lg:size-8'
        classNames='lg:size-4 stroke-neutral-400'
        Icon={ZoomOutIcon}
        onClick={zoomOut}
        disabled={false}
      />
    </div>
  )
}
