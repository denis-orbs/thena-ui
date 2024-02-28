import { cubicBezier, motion, reverseEasing } from 'framer-motion'
import React from 'react'

import { useDimensions } from '@/hooks/useDimensions'

const HEADINGS = ['Native liquidity', 'Lending & Borrowing', 'Cross chain swap', 'Perpetuals DEX']

export function RotatingHeading() {
  const textContainerRef = React.useRef(null)
  const dimensions = useDimensions(textContainerRef, true)

  const timeline = React.useMemo(() => {
    const height = Number(dimensions?.paddingBox.height)

    const timelineArr = []

    HEADINGS.forEach((_, index, arr) => {
      const lastText = index === arr.length - 1
      const y = -height * index

      timelineArr.push(
        {
          time: index * 0.25,
          y,
        },
        {
          time: index * 0.25 + (lastText ? 0.1 : 0.2),
          y,
        },
      )
    })

    // Add the reverse keyframe
    timelineArr.push({
      time: 1,
      y: 0,
    })

    return timelineArr
  }, [dimensions])

  const y = timeline.map(item => item.y)

  const times = timeline.map(item => item.time)

  const easingOnReverse = p => {
    const p2 = p * 2
    return p2 < 1 ? 0.5 * reverseEasing(cubicBezier(0.33, 1.1, 0.69, 0.99))(p2) : 0.5 * (2 - 2 ** (-10 * (p2 - 1)))
  }

  return (
    <span className='relative mb-4 inline-block w-full lg:mb-5'>
      <span
        ref={textContainerRef}
        className='absolute left-1/2 top-1/2 block max-h-[41px] w-full -translate-x-1/2 -translate-y-1/2 overflow-hidden lg:max-h-[88px]'
      >
        {HEADINGS.map((text, index) => (
          <motion.span
            key={`heading-${index}`}
            animate={{ y }}
            transition={{
              duration: 11,
              times,
              repeat: Infinity,
              ease: [
                // easing between each keyframe
                'easeInOut',
                'easeInOut',
                'easeInOut',
                'easeInOut',
                'easeInOut',
                'easeInOut',
                'easeInOut',
                easingOnReverse,
              ],
            }}
            className='block whitespace-nowrap'
          >
            {text}
          </motion.span>
        ))}
      </span>
    </span>
  )
}
