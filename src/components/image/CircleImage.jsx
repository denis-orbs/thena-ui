import Image from 'next/image'
import React, { memo, useCallback, useState } from 'react'

import { UNKNOWN_LOGO } from '@/constant'
import cn from '@/utils/classes'

/**
 *
 * @description Must set width using `w-` className
 */
function CircleImage({ src, alt, width = 100, height = 100, className, ...rest }) {
  const [status, setStatus] = useState('loading')

  const handleLoad = useCallback(() => setStatus('complete'), [])

  return (
    <Image
      className={cn('rounded-full', status === 'loading' && 'animate-pulse bg-neutral-600', className)}
      src={src ?? UNKNOWN_LOGO}
      alt={alt}
      width={width}
      height={height}
      sizes='100vw'
      onLoad={handleLoad}
      {...rest}
    />
  )
}

export default memo(CircleImage)
