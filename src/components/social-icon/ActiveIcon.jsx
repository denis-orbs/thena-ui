import { useState } from 'react'

import NextImage from '../image/NextImage'

export function InstagramIcon({ className, ...props }) {
  const [isHover, setHover] = useState(false)

  return (
    <div className={className} {...props} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {isHover ? (
        <NextImage src='/svgs/instagram-color.svg' alt='instagram icon' />
      ) : (
        <NextImage src='/svgs/instagram-no-color.svg' alt='instagram icon' />
      )}
    </div>
  )
}
