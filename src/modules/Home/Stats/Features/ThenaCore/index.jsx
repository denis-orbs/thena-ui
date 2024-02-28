import { motion, useAnimate } from 'framer-motion'
import Image from 'next/image'
import { useEffect } from 'react'

import { CircularBg } from './CircularBg'
import { Stars } from './Stars'

export function ThenaCore() {
  const [scope, animate] = useAnimate()
  useEffect(() => {
    const animateIllustration = (isReversed = false) => {
      // animate circles
      animate(
        '.features-circle',
        {
          opacity: isReversed ? 0.15 : 0.25,
        },
        {
          duration: 0.6,
          ease: 'easeInOut',
        },
      )

      // animate the logo
      animate(
        '#feature-thena-logo',
        {
          scale: isReversed ? 0.8 : 1,
          opacity: isReversed ? 0.8 : 1,
        },
        {
          duration: 0.6,
          type: 'spring',
          damping: 50,
          stiffness: 200,
        },
      )
      // animate social icons

      animate(
        '#social-icon-1',
        {
          x: isReversed ? 20 : 0,
          y: isReversed ? -20 : 0,
          scale: isReversed ? 1.2 : 1,
        },
        {
          duration: 0.8,
          type: 'spring',
          damping: 40,
          stiffness: 200,
        },
      )

      animate(
        '#social-icon-2',
        {
          x: isReversed ? -20 : 0,
          y: isReversed ? -20 : 0,
          scale: isReversed ? 1.2 : 1,
        },
        {
          duration: 0.4,
          type: 'spring',
          damping: 80,
          stiffness: 200,
        },
      )

      animate(
        '#social-icon-3',
        {
          x: isReversed ? -25 : 0,
          y: isReversed ? 10 : 0,
          scale: isReversed ? 1.2 : 1,
        },
        {
          duration: 0.3,
          type: 'spring',
          damping: 40,
          stiffness: 200,
        },
      )

      animate(
        '#social-icon-4',
        {
          x: isReversed ? -25 : 0,
          y: isReversed ? 30 : 0,
          scale: isReversed ? 1.2 : 1,
        },
        {
          duration: 0.3,
          type: 'spring',
          damping: 40,
          stiffness: 200,
        },
      )

      animate(
        '#social-icon-5',
        {
          x: isReversed ? 10 : 0,
          y: isReversed ? 10 : 0,
          scale: isReversed ? 1.2 : 1,
        },
        {
          duration: 0.2,
          type: 'spring',
          damping: 50,
          stiffness: 200,
        },
      )

      animate(
        '#social-icon-6',
        {
          x: isReversed ? 10 : 0,
          y: isReversed ? -10 : 0,
          scale: isReversed ? 1.1 : 1,
        },
        {
          duration: 0.5,
          type: 'spring',
          damping: 30,
          stiffness: 200,
        },
      )

      // stars
      animate(
        '#feature-stars',
        {
          scale: isReversed ? 0.8 : 1,
          opacity: isReversed ? 0.1 : 1,
        },
        {
          delay: !isReversed && 0.2,
          duration: 0.8,
          type: 'spring',
          damping: 60,
          stiffness: 100,
        },
      )
    }

    animateIllustration()

    const wrapper = document.getElementById('feature-wrapper')

    const onMouseEnter = () => {
      animateIllustration()
    }

    const onMouseLeave = () => {
      animateIllustration(true)
    }

    // hover on scope to reverse animation
    wrapper.addEventListener('mouseenter', onMouseEnter)
    wrapper.addEventListener('mouseleave', onMouseLeave)
    return () => {
      wrapper.removeEventListener('mouseenter', onMouseEnter)
      wrapper.removeEventListener('mouseleave', onMouseLeave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div ref={scope} className='relative mx-auto w-fit'>
      <motion.span
        initial={{
          x: 40,
          y: -40,
          scale: 1.2,
        }}
        id='social-icon-1'
        className='absolute bottom-4 left-20 inline-block'
      >
        <Image width={68} height={80} priority src='/images/home/stats/socials/social-1.png' alt='Thena Core' />
      </motion.span>

      <motion.span
        initial={{
          x: -40,
          y: -40,
          scale: 1.2,
        }}
        id='social-icon-2'
        className='absolute bottom-20 right-10 inline-block'
      >
        <Image width={44} height={44} priority src='/images/home/stats/socials/social-2.png' alt='Thena Core' />
      </motion.span>

      <motion.span
        initial={{
          x: -45,
          y: -10,
          scale: 1.2,
        }}
        id='social-icon-3'
        className='absolute bottom-48 right-4 inline-block'
      >
        <Image width={40} height={40} priority src='/images/home/stats/socials/social-4.png' alt='Thena Core' />
      </motion.span>
      <motion.span
        initial={{
          x: -45,
          y: 50,
          scale: 1.2,
        }}
        id='social-icon-4'
        className='absolute right-20 inline-block'
      >
        <Image width={53} height={53} priority src='/images/home/stats/socials/social-5.png' alt='Thena Core' />
      </motion.span>
      <motion.span
        initial={{
          x: 40,
          y: 40,
          scale: 1.2,
        }}
        id='social-icon-5'
        className='absolute left-20 top-4 inline-block'
      >
        <Image width={35} height={35} priority src='/images/home/stats/socials/social-3.png' alt='Thena Core' />
      </motion.span>
      <motion.span
        initial={{
          x: 30,
          y: 20,
          scale: 1.1,
        }}
        id='social-icon-6'
        className='absolute left-0 top-28'
      >
        <Image width={64} priority height={64} src='/images/home/stats/socials/social-6.png' alt='Thena Core' />
      </motion.span>

      <Stars />
      <CircularBg />
    </div>
  )
}
