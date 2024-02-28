import { motion } from 'framer-motion'
import Image from 'next/image'

export function Swap() {
  return (
    <div>
      <motion.span
        initial={{
          opacity: 0,
          y: 'var(--y-value-initial, 100px)',
        }}
        className='inline-block w-full'
        id='swap-nav'
      >
        <Image
          alt='nav'
          priority
          height={66.09}
          width={1127}
          className='w-full'
          src='/images/home/hero/sequence/swap/nav-swap.png'
        />
      </motion.span>
      <div className='flex w-full items-start justify-center gap-3 px-4 pt-2'>
        <motion.span
          initial={{
            opacity: 0,
            y: 'var(--y-value-initial, 100px)',
          }}
          id='swap-swap'
          className='inline-block w-[30%]'
        >
          <Image
            priority
            sizes='100vw'
            style={{
              width: '100%',
              height: 'auto',
            }}
            className='h-auto'
            alt='nav'
            height={400}
            width={307.58}
            src='/images/home/hero/sequence/swap/swap.png'
          />
        </motion.span>

        <div className='flex w-full flex-1 flex-col gap-3'>
          <motion.span
            initial={{
              opacity: 0,
              y: 'var(--y-value-initial, 100px)',
            }}
            id='swap-chart'
            className='inline-block w-full'
          >
            <Image
              priority
              sizes='100vw'
              style={{
                width: '99%',
                height: 'auto',
              }}
              alt='nav'
              className='h-auto'
              height={313.06}
              width={760.29}
              src='/images/home/hero/sequence/swap/chart.png'
            />
          </motion.span>
          <motion.span
            initial={{
              opacity: 0,
              y: 'var(--y-value-initial, 100px)',
            }}
            className='inline-block w-full'
            id='swap-order-routing'
          >
            <Image
              priority
              sizes='100vw'
              style={{
                width: '99%',
                height: 'auto',
              }}
              className='h-auto'
              alt='nav'
              height={241.88}
              width={760.29}
              src='/images/home/hero/sequence/swap/order-routing.png'
            />
          </motion.span>
        </div>
      </div>
    </div>
  )
}
