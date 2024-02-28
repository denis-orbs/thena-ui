import Image from 'next/image'
import React from 'react'

/**
 *
 * @description Must set width using `w-` className
 */
export default function HomeImage({ src, alt, className, ...rest }) {
  return <Image className={className} src={src} alt={alt} width={100} height={100} sizes='100vw' {...rest} />
}
