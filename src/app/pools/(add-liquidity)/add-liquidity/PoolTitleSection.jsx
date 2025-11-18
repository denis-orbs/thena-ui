import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { NewTextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import InfoIcon from '@/icons/InfoIcon'
import cn from '@/utils/classes'

import CLPoolIcon from '~/svgs/cl-pool-icon.svg'
import ClassicPoolIcon from '~/svgs/classic-pool-icon.svg'
import ScalesIcon from '~/svgs/scales.svg'
import StablePoolIcon from '~/svgs/stable-pool-icon.svg'

const titleSections = {
  [PAIR_TYPES.STABLE]: {
    Icon: StablePoolIcon,
    text: 'Stable Pool',
    description: 'Stable Desc',
  },
  [PAIR_TYPES.CLASSIC]: {
    Icon: ClassicPoolIcon,
    text: 'Classic Pool',
    description: 'Classic Desc',
  },
  [PAIR_TYPES.WEIGHTED]: {
    Icon: ScalesIcon,
    text: 'Weighted Pool',
    description: 'Weighted Desc',
  },
  [PAIR_TYPES.LSD]: {
    Icon: CLPoolIcon,
    text: 'Concentrated Liquidity',
    description: 'Conc Desc',
  },
}

export default function PoolTitleSection({ pairType }) {
  const [show, setShow] = useState(false)
  const t = useTranslations()

  const { Icon, text, description } = titleSections[pairType] ?? titleSections[PAIR_TYPES.LSD]

  return (
    <div className='flex flex-col'>
      <h4 className='flex flex-row items-center gap-2 md:gap-5 xl:gap-8'>
        {Icon && <Icon className='hidden size-6 md:block lg:size-10 2xl:size-12' />}
        <NewTextHeading className='text-3xl lg:text-4xl 2xl:text-5xl'>{t(text)}</NewTextHeading>

        <div className='ml-auto hidden max-lg:block'>
          <i
            onClick={() => setShow(prev => !prev)}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg',
              'size-8 min-w-8 md:size-11 md:min-w-11',
              show ? 'bg-neutral-600' : 'bg-neutral-900',
            )}
          >
            <InfoIcon className='md:size-5' />
          </i>
        </div>
      </h4>

      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='w-full overflow-hidden lg:hidden'
      >
        <div className='z-10 mt-2 flex gap-3 rounded-lg bg-neutral-900 p-4'>
          <p className='text-sm text-neutral-300'>{t(description)}</p>
        </div>
      </motion.div>
    </div>
  )
}
