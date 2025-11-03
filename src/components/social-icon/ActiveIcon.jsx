import Image from 'next/image'
import { useState } from 'react'

export function InstagramIcon({ className, ...props }) {
  const [isHover, setHover] = useState(false)

  return (
    <div className={className} {...props} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {isHover ? <Image src='/svgs/instagram-color.svg' /> : <Image src='/svgs/instagram-no-color.svg' />}
    </div>
  )
}
