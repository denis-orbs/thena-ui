'use client'

import { motion } from 'framer-motion'

export function SwapIcon() {
  return (
    <svg
      className='h-11 w-11 md:h-20 md:w-20'
      width='78'
      height='79'
      viewBox='0 0 78 79'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <g filter='url(#filter0_d_1044_5907)'>
        <g clipPath='url(#clip0_1044_5907)'>
          <rect x='23' y='13.5' width='32' height='32' rx='16' fill='#DF0ED5' />
          <g filter='url(#filter1_f_1044_5907)'>
            <ellipse cx='39' cy='49.5' rx='50' ry='23' fill='url(#paint0_linear_1044_5907)' fillOpacity='0.65' />
          </g>
          <motion.g
            id='introduction-swap-icon'
            className='!origin-center [transform-box:fill-box]'
            clipPath='url(#clip1_1044_5907)'
          >
            <path
              d='M46.3335 32.8335L43.6668 35.5002L41.0002 32.8335'
              stroke='white'
              strokeWidth='1.6'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M39.6665 23.5L40.9998 23.5C41.7071 23.5 42.3854 23.781 42.8855 24.281C43.3856 24.7811 43.6665 25.4594 43.6665 26.1667L43.6665 35.5'
              stroke='white'
              strokeWidth='1.6'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M31.6667 26.1667L34.3333 23.5L37 26.1667'
              stroke='white'
              strokeWidth='1.6'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M38.3335 35.5L37.0002 35.5C36.2929 35.5 35.6146 35.219 35.1145 34.719C34.6144 34.2189 34.3335 33.5406 34.3335 32.8333L34.3335 23.5'
              stroke='white'
              strokeWidth='1.6'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </motion.g>
        </g>
      </g>
      <defs>
        <filter
          id='filter0_d_1044_5907'
          x='0'
          y='0.5'
          width='78'
          height='78'
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity='0' result='BackgroundImageFix' />
          <feColorMatrix
            in='SourceAlpha'
            type='matrix'
            values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
            result='hardAlpha'
          />
          <feOffset dy='10' />
          <feGaussianBlur stdDeviation='11.5' />
          <feComposite in2='hardAlpha' operator='out' />
          <feColorMatrix type='matrix' values='0 0 0 0 0.74902 0 0 0 0 0.45098 0 0 0 0 0.972549 0 0 0 0.24 0' />
          <feBlend mode='normal' in2='BackgroundImageFix' result='effect1_dropShadow_1044_5907' />
          <feBlend mode='normal' in='SourceGraphic' in2='effect1_dropShadow_1044_5907' result='shape' />
        </filter>
        <filter
          id='filter1_f_1044_5907'
          x='-23'
          y='14.5'
          width='124'
          height='70'
          filterUnits='userSpaceOnUse'
          colorInterpolationFilters='sRGB'
        >
          <feFlood floodOpacity='0' result='BackgroundImageFix' />
          <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
          <feGaussianBlur stdDeviation='6' result='effect1_foregroundBlur_1044_5907' />
        </filter>
        <linearGradient id='paint0_linear_1044_5907' x1='39' y1='26.5' x2='39' y2='49.5' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#3F8CFF' />
          <stop offset='0.119792' stopColor='#9A5EFF' />
        </linearGradient>
        <clipPath id='clip0_1044_5907'>
          <rect x='23' y='13.5' width='32' height='32' rx='16' fill='white' />
        </clipPath>
        <clipPath id='clip1_1044_5907'>
          <rect width='16' height='16' fill='white' transform='translate(47 21.5) rotate(90)' />
        </clipPath>
      </defs>
    </svg>
  )
}
