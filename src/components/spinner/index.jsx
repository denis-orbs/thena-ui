import React from 'react'

import { cn } from '@/lib/utils'

import NextImage from '../image/NextImage'

function Spinner({ className }) {
  return (
    <NextImage
      className={cn('animate-spin', className)}
      width={20}
      height={20}
      src='/images/spin.png'
      alt='thena spin'
    />
  )
}

export default Spinner
