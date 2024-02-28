import { select, zoom } from 'd3'
import React, { useEffect, useMemo, useRef } from 'react'

import { OutlineIconButton } from '@/components/buttons/IconButton'
import { ZoomInIcon, ZoomOutIcon } from '@/svgs'

export default function Zoom({ svg, xScale, setZoom, width, height, zoomLevels }) {
  const zoomBehavior = useRef()

  const [zoomIn, zoomOut, zoomInitial] = useMemo(
    () => [
      () => svg && zoomBehavior.current && select(svg).transition().call(zoomBehavior.current.scaleBy, 2),
      () => svg && zoomBehavior.current && select(svg).transition().call(zoomBehavior.current.scaleBy, 0.5),
      () => svg && zoomBehavior.current && select(svg).transition().call(zoomBehavior.current.scaleTo, 0.5),
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
    <div className='absolute -top-[20px] right-0 grid grid-cols-2 gap-1'>
      <OutlineIconButton
        className='lg:h-6 lg:w-6'
        classNames='lg:h-4 lg:w-4'
        Icon={ZoomInIcon}
        onClick={zoomIn}
        disabled={false}
      />
      <OutlineIconButton
        className='lg:h-6 lg:w-6'
        classNames='lg:h-4 lg:w-4'
        Icon={ZoomOutIcon}
        onClick={zoomOut}
        disabled={false}
      />
    </div>
  )
}
