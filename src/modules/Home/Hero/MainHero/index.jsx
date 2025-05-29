import { useAnimate } from 'framer-motion'
import { useEffect } from 'react'

import { cn } from '@/lib/utils'

import { animatePools, animateSwap, reverseAnimatePools, reverseAnimateSwap } from './animations'
import { LightDripAnimation } from './LightDripAnimation'
import { Pools } from './Pools'
import { Swap } from './Swap'

export function MainHero() {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    const startSequence = async () => {
      await animateSwap(animate)
      await reverseAnimateSwap(animate)
      await animatePools(animate)
      await reverseAnimatePools(animate)

      // loop
      startSequence()
    }

    startSequence()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={scope}
      className={cn(
        'relative z-20 mt-8 w-full rounded-2xl p-2 sm:my-12 md:rounded-[20px] md:p-3 lg:mt-[73px] lg:mb-[73px]',
        'before:absolute before:inset-0 before:rounded-[inherit] before:p-0.5',
        'before:bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_100%)]',
        'before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]',
        'before:[-webkit-mask-composite:xor]',
        'before:mask-exclude',
      )}
      style={{
        maskImage: 'linear-gradient(rgb(0 0 0 / 1) 60%, rgb(0 0 0 / 0.01) 90%, rgb(0 0 0 / 0))',
        WebkitMaskImage: 'linear-gradient(rgb(0 0 0 / 1) 60%, rgb(0 0 0 / 0.01) 90%, rgb(0 0 0 / 0))',
        background:
          'linear-gradient(0deg, rgba(56, 47, 65, 0.12), rgba(56, 47, 65, 0.12)), linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 100%)',
      }}
    >
      <LightDripAnimation
        className='top-16 left-0 md:top-24 lg:top-44'
        transitions={{
          delay: 0.15 * 2,
        }}
      />
      <LightDripAnimation />
      <div className='relative overflow-hidden rounded-[10px] bg-[#030204]/70 [--x-value-initial:20px] [--y-value-initial:20px] md:[--x-value-initial:40px] md:[--y-value-initial:100px] lg:bg-[#030204]'>
        <Swap />
        <Pools />
      </div>
    </div>
  )
}
