import { motion, useAnimate } from 'framer-motion'
import { useEffect } from 'react'

import { Paragraph } from '@/components/typography'
import { cn } from '@/lib/utils'

import { Algorand, Ape, Avalanche, BNB, Tezos, Thena, USDC } from '../CoinIcons'
import { FeatureCard } from '../FeatureCard'

const MotionFeatureCard = motion(FeatureCard)

function StakeAndEarnCard({ className, coinPair, arr, netReturn, tvl, netReturn30d }) {
  return (
    <MotionFeatureCard
      className={cn(
        'relative z-40 min-w-[220px] rounded-md bg-[linear-gradient(0deg,_rgba(19,_10,_23,_0.99),_rgba(19,_10,_23,_0.99))] backdrop-blur-lg',
        'before:bg-[linear-gradient(180deg,_rgba(214,_66,_219,_0.45)_0%,_rgba(214,_66,_219,_0)_100%)] before:opacity-0 md:min-w-[255.74px]  md:rounded-lg',
        'after:bg-[linear-gradient(180deg,_rgba(214,_66,_219,_0.12)_0%,_rgba(214,_66,_219,_0)_100%)]',
        'before:duration-500',
        'before:opacity-100 before:group-hover:opacity-100 before:lg:opacity-0',
        '[--x-multiplier:-3] [--y-multiplier:3]',
        'pointer-events-none',
        className,
      )}
    >
      <div className=' flex items-center gap-1'>
        <div className='relative mr-4 md:mr-5'>{coinPair.icons}</div>
        <Paragraph className='text-xs font-semibold text-white'>{coinPair.name}</Paragraph>
      </div>
      <div className='mt-4 border-t border-t-[#281B2D] pt-4'>
        <div className='flex items-center justify-between space-y-2'>
          <Paragraph className='text-[10px] text-white'>ARR</Paragraph>
          <Paragraph className='text-xs font-medium text-[#26E222]'>{arr}%</Paragraph>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-[10px] text-white'>Net return</Paragraph>
          <Paragraph className='text-xs font-medium'>${netReturn}</Paragraph>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-[10px] text-white'>TVL</Paragraph>
          <Paragraph className='text-xs font-medium'>${tvl}</Paragraph>
        </div>
        <div className='flex items-center justify-between'>
          <Paragraph className='text-[10px] text-white'>Net return (30d)</Paragraph>
          <Paragraph className='text-xs font-medium'>${netReturn30d}</Paragraph>
        </div>
      </div>
    </MotionFeatureCard>
  )
}

export function StakeAndEarn({ noAnimation }) {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    if (noAnimation) return

    const animateCards = (isReversed = false) => {
      animate(
        '.stake-and-earn-card-1',
        {
          rotate: isReversed ? '0deg' : '-2deg',
          x: isReversed ? 'calc(var(--x-multiplier) * 10px)' : 'calc(var(--x-multiplier) * 18px)',
          y: isReversed ? 'calc(var(--y-multiplier) * 10px)' : 'calc(var(--y-multiplier) * 18px)',
        },
        {
          duration: 0.8,
          ease: 'backOut',
        },
      )
      animate(
        '.stake-and-earn-card-2',
        {
          rotate: isReversed ? '0deg' : '3deg',
          x: isReversed ? 'calc(var(--x-multiplier) * 10px)' : 'calc(var(--x-multiplier) * 18px)',
          y: isReversed ? 'calc(var(--y-multiplier) * 10px)' : 'calc(var(--y-multiplier) * 18px)',
        },
        {
          duration: 0.8,
          ease: 'backOut',
        },
      )
      animate(
        '.stake-and-earn-card-3',
        {
          rotate: isReversed ? '0deg' : '10deg',
          x: isReversed ? 'calc(var(--x-multiplier) * 10px)' : 'calc(var(--x-multiplier) * 18px)',
          y: isReversed ? 'calc(var(--y-multiplier) * 10px)' : 'calc(var(--y-multiplier) * 18px)',
        },
        {
          duration: 0.8,
          ease: 'backOut',
        },
      )
      animate(
        '.stake-and-earn-card-4',
        {
          rotate: isReversed ? '0deg' : '12deg',
          x: isReversed ? 'calc(var(--x-multiplier) * 10px)' : 'calc(var(--x-multiplier) * 18px)',
          y: isReversed ? 'calc(var(--y-multiplier) * 10px)' : 'calc(var(--y-multiplier) * 18px)',
        },
        {
          duration: 0.8,
          ease: 'backOut',
        },
      )
    }

    animateCards()

    const wrapper = document.getElementById('feature-wrapper')

    const onMouseEnter = () => {
      animateCards()
    }

    const onMouseLeave = () => {
      animateCards(true)
    }

    // hover on scope to reverse animation
    wrapper.addEventListener('mouseenter', onMouseEnter)
    wrapper.addEventListener('mouseleave', onMouseLeave)
    return () => {
      wrapper.removeEventListener('mouseenter', onMouseEnter)
      wrapper.removeEventListener('mouseleave', onMouseLeave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noAnimation])

  return (
    <motion.div ref={scope} className='mt-20 flex h-full w-full items-center justify-center lg:mt-0'>
      <StakeAndEarnCard
        coinPair={{
          name: 'TEZ/ALG',
          icons: (
            <>
              <Tezos className=' h-4 w-4 md:h-5 md:w-5 md:translate-y-0.5' />
              <Algorand className='absolute -right-3 top-0 h-4 w-4 md:-right-4 md:h-6 md:w-6' />
            </>
          ),
        }}
        className={cn(
          'stake-and-earn-card-1',
          'translate-x-[calc(var(--x-multiplier)*18px)] translate-y-[calc(var(--y-multiplier)*12px)] rotate-[-2deg]',
        )}
        arr={2.1}
        netReturn={123.45}
        tvl='16.4M'
        netReturn30d={12.33}
      />
      <StakeAndEarnCard
        coinPair={{
          name: 'APE/AVA',
          icons: (
            <>
              <Ape className=' h-4 w-4 md:h-5 md:w-5 md:translate-y-0.5' />
              <Avalanche className='absolute -right-3 top-0 h-4 w-4 md:-right-4 md:h-6 md:w-6' />
            </>
          ),
        }}
        arr={2.1}
        netReturn={123.45}
        tvl='16.4M'
        netReturn30d={12.33}
        className={cn(
          'stake-and-earn-card-2 absolute [--x-multiplier:-1] [--y-multiplier:1]',
          'translate-x-[calc(var(--x-multiplier)*18px)] translate-y-[calc(var(--y-multiplier)*8px)] rotate-[3deg]',
        )}
      />
      <StakeAndEarnCard
        coinPair={{
          name: 'USDC/THE',
          icons: (
            <>
              <USDC className=' h-4 w-4 md:h-5 md:w-5 md:translate-y-0.5' />
              <Thena className='absolute -right-3 top-0 h-4 w-4 md:-right-4 md:h-6 md:w-6' />
            </>
          ),
        }}
        arr={2.1}
        netReturn={123.45}
        tvl='16.4M'
        netReturn30d={12.33}
        className={cn(
          'stake-and-earn-card-3 absolute [--x-multiplier:1] [--y-multiplier:-1]',
          'translate-x-[calc(var(--x-multiplier)*18px)] translate-y-[calc(var(--y-multiplier)*8px)] rotate-[10deg]',
        )}
      />
      <StakeAndEarnCard
        coinPair={{
          name: 'BNB/THE',
          icons: (
            <>
              <BNB className=' h-4 w-4 md:h-5 md:w-5 md:translate-y-0.5' />
              <Thena className='absolute -right-3 top-0 h-4 w-4 md:-right-4 md:h-6 md:w-6' />
            </>
          ),
        }}
        arr={2.1}
        netReturn={123.45}
        tvl='16.4M'
        netReturn30d={12.33}
        className={cn(
          'stake-and-earn-card-4 absolute [--x-multiplier:3] [--y-multiplier:-3]',
          'translate-x-[calc(var(--x-multiplier)*18px)] translate-y-[calc(var(--y-multiplier)*13px)] rotate-[15deg]',
        )}
      />
    </motion.div>
  )
}
