import { motion, useAnimate } from 'framer-motion'
import Image from 'next/image'
import { forwardRef, useEffect } from 'react'

import { Paragraph } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

import { SwapIcon } from './SwapIcon'
import { BNB, Thena } from '../CoinIcons'
import { FeatureCard } from '../FeatureCard'

function CoinBadge({ className, name }) {
  const coins = {
    BNB: <BNB className='h-4 w-4 md:h-5 md:w-5' />,
    THE: <Thena className='h-4 w-4 md:h-5 md:w-5' />,
  }

  const coin = coins[name]

  return (
    <div className={cn('flex w-fit items-center gap-2 rounded-full bg-[#0B050B] p-1 pr-1.5 md:p-2 md:pr-3', className)}>
      <div className='flex items-center gap-1'>
        {coin}
        <Paragraph className='text-xs font-semibold tracking-[-4%] md:text-base'>{name}</Paragraph>
      </div>
      <ChevronDownIcon className='h-4 w-4' />
    </div>
  )
}

const SwapableCoin = forwardRef(({ id, className, coin, balance, price1, price2 }, ref) => (
  <div
    ref={ref}
    id={id}
    className={cn('flex items-start justify-between rounded-xl bg-[#1A0C1E] p-4 md:rounded-2xl md:p-6', className)}
  >
    <div>
      <Paragraph className='block text-base font-semibold tracking-[-4%] text-white md:text-2xl'>{price1}</Paragraph>
      <Paragraph className='block text-[9px] tracking-[-4%] text-white/35 md:text-sm'>${price2}</Paragraph>
    </div>
    <div className='flex flex-col items-end gap-1'>
      <CoinBadge name={coin} />
      <span className='text-[9px] md:text-sm'>Balance: {balance}</span>
    </div>
  </div>
))

SwapableCoin.displayName = 'SwapableCoin'

const MotionSwapableCoin = motion(SwapableCoin)

export function IntroductionIllustration() {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    const runAnimation = async isPaused => {
      const animation1 = animate(
        '#introduction-swap-icon',
        {
          rotate: isPaused ? [180, 0] : [0, 180],
        },
        {
          duration: 0.6,
          ease: 'easeInOut',
        },
      )

      const animation2 = animate(
        '#swappable-coin-1',
        {
          y: isPaused ? ['calc(100% + 6px)', '0'] : ['0', 'calc(100% + 6px)'],
        },
        {
          duration: 0.6,
          ease: 'easeInOut',
        },
      )
      const animation3 = animate(
        '#swappable-coin-2',
        {
          y: isPaused ? ['calc(-100% - 6px)', '0'] : ['0', 'calc(-100% - 6px)'],
        },
        {
          duration: 0.6,
          ease: 'easeInOut',
        },
      )
      const animation4 = animate(
        '#introduction-swap-icon-glow',
        {
          opacity: isPaused ? [0.5, 0] : [0, 0.5],
        },
        {
          duration: 0.6,
          ease: 'easeInOut',
        },
      )

      return [animation1, animation2, animation3, animation4]
    }

    const wrapper = document.getElementById('feature-wrapper')

    const onMouseEnter = async () => {
      await runAnimation()
    }

    const onMouseLeave = async () => {
      // complete the existing animation
      await runAnimation(true)
    }

    // hover on scope to reverse animation
    wrapper.addEventListener('mouseenter', onMouseEnter)
    wrapper.addEventListener('mouseleave', onMouseLeave)
    return () => {
      wrapper.removeEventListener('mouseenter', onMouseEnter)
      wrapper.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [animate])

  return (
    <div ref={scope} className='grid min-w-[60vw] max-w-[500px] grid-cols-12 grid-rows-12 lg:min-w-[auto]'>
      <FeatureCard className='relative col-start-1 col-end-11 row-start-1 row-end-8 h-fit overflow-hidden bg-[#0c0911] before:duration-500 after:bg-[linear-gradient(129.41deg,_rgba(255,_255,_255,_0.08)_0%,_rgba(255,_255,_255,_0)_38.31%)] before:group-hover:opacity-100 before:lg:opacity-0'>
        <div className='absolute -right-10 top-0 hidden h-[200px] w-[200px] rounded-full bg-fuchsia-600 bg-opacity-[45%] blur-[220px] filter lg:block' />
        <div className='absolute left-4 top-4 flex w-fit items-center gap-2 rounded-full bg-[#201424] p-1 pr-1.5 md:p-2 md:pr-3'>
          <div className='flex items-center gap-1'>
            <BNB className='h-4 w-4 md:h-5 md:w-5' width={20} height={20} />
            <Paragraph className='text-xs font-semibold tracking-[-4%] md:text-base'>BNB/THE</Paragraph>
          </div>
          <ChevronDownIcon className='h-4 w-4' />
        </div>
        <Image src='/images/home/stats/graph.png' className='h-full w-full' alt='graph' width={351} height={190} />
      </FeatureCard>
      <FeatureCard className='relative col-start-4 col-end-13 row-start-5 row-end-13 h-fit min-w-[240px] overflow-hidden bg-black/25 bg-[linear-gradient(0deg,_rgba(0,_0,_0,_0.25),_rgba(0,_0,_0,_0.25))] backdrop-blur-3xl before:bg-[linear-gradient(188.68deg,_rgba(220,_1,_212,_0.45)_5.6%,_rgba(206,_79,_198,_0)_92.91%)] before:duration-500 after:bg-[linear-gradient(129.41deg,_rgba(255,_255,_255,_0.06)_0%,_rgba(255,_255,_255,_0)_38.31%)] before:group-hover:opacity-100 before:lg:opacity-0'>
        <div className='absolute right-0 top-0 hidden h-[200px] w-[200px] rounded-full bg-fuchsia-600 bg-opacity-[45%] blur-[220px] filter lg:block' />
        <div className='relative flex flex-col space-y-1.5'>
          <MotionSwapableCoin
            id='swappable-coin-1'
            coin='BNB'
            balance={12.33}
            className='pt-2 md:pt-4'
            price1={1.124}
            price2={319.58}
          />
          <div className='pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2'>
            {/* Custom glow effect */}
            <motion.div
              id='introduction-swap-icon-glow'
              className='absolute -right-1 top-8 h-6 w-20 rounded-full bg-[linear-gradient(180deg,_rgba(63,_140,_255,_0.65)_0%,_rgba(154,_94,_255,_0.65)_5.99%)] opacity-50 blur-2xl md:h-12 md:w-24'
            />
            <SwapIcon />
          </div>
          <MotionSwapableCoin
            id='swappable-coin-2'
            balance={1.392}
            coin='THE'
            price2={219.58}
            price1={112.12}
            className='items-end pb-2 md:pb-4'
          />
        </div>
      </FeatureCard>
    </div>
  )
}
