import Image from 'next/image'
import React from 'react'

import { cn } from '@/lib/utils'

function Spinner({ className }) {
  return (
    <Image className={cn('animate-spin', className)} width={20} height={20} src='/images/spin.png' alt='thena spin' />
  )
}

export default Spinner
