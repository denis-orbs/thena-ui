import { motion } from 'framer-motion'

export function GridLinesAnimation() {
  return (
    <svg
      className='absolute top-10 h-[352px] w-full md:top-[145px] md:h-[481px]'
      preserveAspectRatio='none'
      width='1390'
      height='481'
      viewBox='0 0 1390 481'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <g opacity='0.45'>
        <motion.rect
          width='2'
          transition={{
            duration: 0.15 * 24, // 150ms
            repeat: Infinity,
            ease: 'linear',
          }}
          animate={{
            transform: [
              'rotate(-51.218deg) translate(0px, 0px)',
              'rotate(-51.218deg) translate(0px, 10%)',
              'rotate(-51.218deg) translate(0px, 25%)',
              'rotate(-51.218deg) translate(0px, 30%)',
            ],
            fillOpacity: [0, 1, 0.8, 0],
            attrX: 1171.98,
            attrY: 175.137,
          }}
          height='48'
          rx='1'
          fill='url(#paint0_linear_1025_4837)'
        />
      </g>
      <g opacity='0.45'>
        <motion.rect
          width='2'
          height='56'
          rx='1'
          transition={{
            duration: 0.15 * 24, // 150ms
            repeat: Infinity,
            ease: 'linear',
          }}
          animate={{
            transform: [
              'rotate(-15.2966deg) translate(0px, 0px)',
              'rotate(-15.2966deg) translate(0px, 10%)',
              'rotate(-15.2966deg) translate(0px, 25%)',
              'rotate(-15.2966deg) translate(0px, 30%)',
            ],
            fillOpacity: [0, 1, 0.8, 0],
            attrX: 825.856,
            attrY: 280.496,
          }}
          fill='url(#paint1_linear_1025_4837)'
          fillOpacity='0.8'
        />
      </g>
      <g opacity='0.45'>
        <motion.rect
          width='2'
          height='48'
          rx='1'
          transition={{
            duration: 0.15 * 24, // 150ms
            repeat: Infinity,
            ease: 'linear',
          }}
          className='[--x-value:-2px] md:[--x-value:8px]'
          animate={{
            transform: [
              'rotate(-90deg) translate(var(--x-value), 0px)',
              'rotate(-90deg) translate(var(--x-value), 10%)',
              'rotate(-90deg) translate(var(--x-value), 25%)',
              'rotate(-90deg) translate(var(--x-value), 30%)',
            ],
            fillOpacity: [0, 1, 0.8, 0],
            attrX: 0,
            attrY: 247.5,
          }}
          fill='url(#paint2_linear_1025_4837)'
          fillOpacity='0.8'
        />
      </g>
      <g opacity='0.45'>
        <motion.rect
          width='2'
          height='48'
          rx='1'
          transition={{
            duration: 0.15 * 24, // 150ms
            repeat: Infinity,
            ease: 'linear',
          }}
          animate={{
            transform: [
              'rotate(-90deg) translate(0px, 0px)',
              'rotate(-90deg) translate(0px, 10%)',
              'rotate(-90deg) translate(0px, 25%)',
              'rotate(-90deg) translate(0px, 30%)',
            ],
            fillOpacity: [0, 1, 0.8, 0],
            attrX: 473,
            attrY: 414.5,
          }}
          transform='rotate(-90 473 414.5)'
          fill='url(#paint3_linear_1025_4837)'
          fillOpacity='0.8'
        />
      </g>
      <g opacity='0.65'>
        <motion.rect
          width='2'
          height='72'
          transition={{
            duration: 0.15 * 24, // 150ms
            repeat: Infinity,
            ease: 'linear',
          }}
          animate={{
            transform: [
              'rotate(-73.3682deg) translate(0px, 0px)',
              'rotate(-73.3682deg) translate(0px, 10%)',
              'rotate(-73.3682deg) translate(0px, 25%)',
              'rotate(-73.3682deg) translate(0px, 30%)',
            ],
            fillOpacity: [0, 1, 0.8, 0],
            attrX: 426.162,
            attrY: 0.6,
          }}
          rx='1'
          fill='url(#paint4_linear_1025_4837)'
          fillOpacity='0.8'
        />
      </g>
      <defs>
        <linearGradient
          id='paint0_linear_1025_4837'
          x1='1164.98'
          y1='175.137'
          x2='1164.98'
          y2='223.137'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#0D0918' stopOpacity='0' />
          <stop offset='0.890625' stopColor='#DC00D4' />
          <stop offset='1' stopColor='#F21EEA' />
        </linearGradient>
        <linearGradient
          id='paint1_linear_1025_4837'
          x1='830.856'
          y1='280.496'
          x2='830.856'
          y2='336.496'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#0D0918' stopOpacity='0' />
          <stop offset='0.890625' stopColor='#DC00D4' />
          <stop offset='1' stopColor='#F215EA' />
        </linearGradient>
        <linearGradient id='paint2_linear_1025_4837' x1='1' y1='245.5' x2='1' y2='293.5' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#0D0918' stopOpacity='0' />
          <stop offset='0.890625' stopColor='#DC00D4' />
          <stop offset='1' stopColor='#F21EEA' />
        </linearGradient>
        <linearGradient
          id='paint3_linear_1025_4837'
          x1='474'
          y1='414.5'
          x2='474'
          y2='462.5'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#0D0918' stopOpacity='0' />
          <stop offset='0.890625' stopColor='#DC00D4' />
          <stop offset='1' stopColor='#F215EA' />
        </linearGradient>
        <linearGradient
          id='paint4_linear_1025_4837'
          x1='427.162'
          y1='0.6'
          x2='427.162'
          y2='107.455'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor='#0D0918' stopOpacity='0' />
          <stop offset='0.890625' stopColor='#DC00D4' />
          <stop offset='1' stopColor='#F215EA' />
        </linearGradient>
      </defs>
    </svg>
  )
}
