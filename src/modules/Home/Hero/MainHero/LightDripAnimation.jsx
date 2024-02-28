import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

export function LightDripAnimation({ className, transitions, ...props }) {
  return (
    <svg
      className={cn('absolute right-0 top-0 h-[150px] md:h-[264px]', className)}
      width='3'
      height='264'
      viewBox='0 0 3 264'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <motion.rect
        initial={{ y: '0%', fillOpacity: 0 }}
        animate={{ y: ['0%', '20%', '65%', '100%'], fillOpacity: [0, 1, 0.8, 0] }}
        transition={{
          duration: 0.15 * 24,
          repeat: Infinity,
          ease: 'linear',
          ...transitions,
        }}
        x='0.5'
        width='2'
        height='48'
        rx='1'
        fill='url(#paint0_linear_1025_5134)'
      />
      <defs>
        <linearGradient id='paint0_linear_1025_5134' x1='1.5' y1='0' x2='1.5' y2='48' gradientUnits='userSpaceOnUse'>
          <stop stopColor='#0D0918' stopOpacity='0' />
          <stop offset='0.890625' stopColor='#DC00D4' />
          <stop offset='1' stopColor='#EC11E4' />
        </linearGradient>
      </defs>
    </svg>
  )
}
