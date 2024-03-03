import { motion } from 'framer-motion'
import Image from 'next/image'

import { TextHeading } from '@/components/typography'

export function Pools() {
  return (
    <div className='absolute inset-x-0 top-0'>
      <motion.span
        initial={{
          opacity: 0,
        }}
        className='inline-block w-full'
        id='pools-nav'
      >
        <Image
          priority
          alt='nav'
          className='w-full'
          height={66.09}
          width={1127}
          src='/images/home/hero/sequence/pools/nav-pools.png'
        />
      </motion.span>
      <motion.span
        className='inline-block w-full'
        initial={{
          opacity: 0,
        }}
        id='pools-heading'
      >
        <TextHeading className='block px-4 py-3 font-archia text-[8px] font-semibold text-neutral-50 sm:text-xs md:px-[30px] md:text-lg'>
          Trending pools
        </TextHeading>
      </motion.span>
      <div className='flex gap-3.5 px-4 md:px-[30px]'>
        <motion.span
          className='pools-card inline-block w-full'
          initial={{
            opacity: 0,
            x: 'var(--x-value-initial, 40px)',
          }}
          id='pools-card-1'
        >
          <Image
            priority
            sizes='100vw'
            style={{
              width: '100%',
              height: 'auto',
            }}
            alt='nav'
            height={186.1}
            width={255.74}
            src='/images/home/hero/sequence/pools/card-1.png'
          />
        </motion.span>
        <motion.span
          className='pools-card inline-block w-full'
          initial={{
            opacity: 0,
            x: 'var(--x-value-initial, 40px)',
          }}
          id='pools-card-2'
        >
          <Image
            priority
            sizes='100vw'
            style={{
              width: '100%',
              height: 'auto',
            }}
            alt='nav'
            height={186.1}
            width={255.74}
            src='/images/home/hero/sequence/pools/card-2.png'
          />
        </motion.span>
        <motion.span
          className='pools-card inline-block w-full'
          initial={{
            opacity: 0,
            x: 'var(--x-value-initial, 40px)',
          }}
          id='pools-card-3'
        >
          <Image
            priority
            sizes='100vw'
            style={{
              width: '100%',
              height: 'auto',
            }}
            alt='nav'
            height={186.1}
            width={255.74}
            src='/images/home/hero/sequence/pools/card-3.png'
          />
        </motion.span>
        <motion.span
          className='pools-card inline-block w-full'
          initial={{
            opacity: 0,
            x: 'var(--x-value-initial, 40px)',
          }}
          id='pools-card-4'
        >
          <Image
            priority
            sizes='100vw'
            style={{
              width: '100%',
              height: 'auto',
            }}
            alt='nav'
            height={186.1}
            width={255.74}
            src='/images/home/hero/sequence/pools/card-4.png'
          />
        </motion.span>
      </div>
      <div className='flex w-full items-center justify-between gap-4 px-4 py-3 md:px-[30px]'>
        <motion.span
          className='flex w-full items-center'
          initial={{
            opacity: 0,
            y: 'var(--y-value-initial, 100px)',
          }}
          id='pools-active-pools'
        >
          <TextHeading className='font-archia text-[8px] font-semibold text-neutral-50 sm:text-xs md:text-lg'>
            Active Pools
          </TextHeading>
        </motion.span>
        <motion.span
          className='flex w-full items-center'
          initial={{
            opacity: 0,
            y: 'var(--y-value-initial, 100px)',
          }}
          id='pools-search-bar'
        >
          <Image
            priority
            alt='nav'
            className='ml-auto w-full max-w-[125px] md:max-w-[305.24px]'
            height={31.52}
            width={305.24}
            src='/images/home/hero/sequence/pools/search-bar.png'
          />
        </motion.span>
      </div>

      <div className='flex gap-3.5 px-4 md:px-[30px]'>
        <motion.span
          className='inline-block w-full'
          initial={{
            opacity: 0,
            y: 'var(--y-value-initial, 100px)',
          }}
          id='pools-table'
        >
          <Image
            priority
            sizes='100vw'
            style={{
              width: '100%',
              height: 'auto',
            }}
            alt='nav'
            height={186.1}
            width={255.74}
            src='/images/home/hero/sequence/pools/table.png'
          />
        </motion.span>
      </div>
    </div>
  )
}
