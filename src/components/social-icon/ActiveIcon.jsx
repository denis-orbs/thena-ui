import { useState } from 'react'

import { InstagramColorIcon, InstagramNoColorIcon } from '@/svgs'

export function InstagramIcon({ className, ...props }) {
  const [isHover, setHover] = useState(false)

  return (
    <div className={className} {...props} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {isHover ? <InstagramColorIcon /> : <InstagramNoColorIcon />}
    </div>
  )
}
