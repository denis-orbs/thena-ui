import React from 'react'

import Spinner from '@/components/spinner'

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return <Spinner className='absolute left-[50%] top-[50%] h-10 w-10' />
}
