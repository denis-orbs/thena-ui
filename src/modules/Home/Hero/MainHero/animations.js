import { stagger } from 'framer-motion'

const navDuration = 0.7

const animationDuration = 0.8
const animationDelay = 0.6

const reverseAnimationDuration = 0.5
const reverseAnimationDelay = 1

const animateSwap = async animate => {
  const animation = {
    y: 0,
    opacity: 1,
  }

  const transition = {
    delay: animationDelay,
    duration: animationDuration,
    ease: 'easeOut',
  }

  animate('#swap-nav', animation, {
    duration: navDuration,
    delay: 0,
    ease: 'easeOut',
  })
  animate('#swap-swap', animation, transition)
  animate('#swap-chart', animation, transition)

  await animate('#swap-order-routing', animation, transition)
}

const reverseAnimateSwap = async animate => {
  const animation = {
    y: 'var(--y-value-initial, 100px)',
    opacity: 0,
  }

  const transition = {
    delay: reverseAnimationDelay,
    duration: reverseAnimationDuration,
    ease: 'easeIn',
  }

  animate('#swap-swap', animation, transition)
  animate('#swap-chart', animation, transition)

  await animate('#swap-order-routing', animation, transition)
}

const animatePools = async animate => {
  animate(
    '#pools-nav',
    {
      y: 0,
      opacity: 1,
    },
    {
      duration: navDuration,
      ease: 'easeOut',
    },
  )

  // animating swap nav out for smooth transition
  await animate(
    '#swap-nav',
    {
      opacity: 0,
    },
    {
      duration: animationDuration,
      ease: 'easeOut',
    },
  )

  animate(
    '#pools-heading',
    {
      opacity: 1,
    },
    {
      duration: animationDuration,
      ease: 'easeOut',
    },
  )

  animate(
    '.pools-card',
    {
      opacity: 1,
      x: 0,
    },
    {
      delay: stagger(0.2),
      duration: animationDuration,
      ease: 'easeOut',
    },
  )

  animate(
    '#pools-active-pools',
    {
      y: 0,
      opacity: 1,
    },
    {
      delay: animationDelay,
      duration: animationDuration,
      ease: 'easeOut',
    },
  )

  animate(
    '#pools-search-bar',
    {
      y: 0,
      opacity: 1,
    },
    {
      delay: animationDelay,
      duration: animationDuration,
      ease: 'easeOut',
    },
  )

  await animate(
    '#pools-table',
    {
      y: 0,
      opacity: 1,
    },
    {
      delay: animationDelay,
      duration: animationDuration,
      ease: 'easeOut',
    },
  )
}

const reverseAnimatePools = async animate => {
  const animation = {
    opacity: 0,
    y: 'var(--y-value-initial, 100px)',
  }

  const transition = {
    delay: reverseAnimationDelay,
    duration: reverseAnimationDuration,
    ease: 'easeIn',
  }

  animate(
    '#pools-heading',
    {
      ...animation,
      transitionEnd: {
        y: 0,
      },
    },
    transition,
  )

  animate('.pools-card', { ...animation, transitionEnd: { y: 0, x: 'var(--x-value-initial, 40px)' } }, transition)

  animate('#pools-active-pools', animation, transition)

  animate('#pools-search-bar', animation, transition)

  await animate('#pools-table', animation, transition)

  // nav
  await animate(
    '#pools-nav',
    {
      ...animation,
      transitionEnd: {
        y: 0,
      },
    },
    {
      delay: 0.1,
      duration: 0.4,
      ease: 'easeIn',
    },
  )

  // setting some delay so that there's some delay before the swap nav comes in
  await animate(
    '#swap-nav',
    {
      y: 'var(--y-value-initial, 100px)',
    },
    {
      delay: 0.25,
      duration: 0,
    },
  )
}

export { animatePools, animateSwap, reverseAnimatePools, reverseAnimateSwap }
