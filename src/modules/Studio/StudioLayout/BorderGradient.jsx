import React from 'react'
// A gradient border component used in the Studio layout used to convert html to image keep the border
// without using CSS border-image or similar properties that may not render correctly in the image conversion.
export default function BorderGradient() {
  return (
    <svg
      className='pointer-events-none absolute inset-0 h-full w-full'
      style={{ borderRadius: '12px' }}
      preserveAspectRatio='none'
      aria-hidden
    >
      <defs>
        <linearGradient id='border-gradient' x1='0%' y1='0%' x2='0%' y2='100%'>
          <stop offset='1.03%' stopColor='rgba(205,7,210,0.5)' />
          <stop offset='99.11%' stopColor='rgba(205,7,210,0)' />
        </linearGradient>
      </defs>
      <rect
        x='0.5'
        y='0.5'
        width='calc(100% - 1px)'
        height='calc(100% - 1px)'
        rx='12'
        ry='12'
        fill='none'
        stroke='url(#border-gradient)'
        strokeWidth='1'
        vectorEffect='non-scaling-stroke'
      />
    </svg>
  )
}
