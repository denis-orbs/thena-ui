import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import Box from '@/components/box'
import { NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { cn } from '@/lib/utils'
import { NormalPoolAttributes, PoolAttributesCL } from '@/modules/Pools/PoolAttributes'
import { InfoIcon } from '@/svgs'

export function PoolAttributesSection({ strategy, pair, className }) {
  const t = useTranslations()
  const [show, setShow] = useState(false)

  return (
    <div className='flex w-full flex-col'>
      <div className='flex items-center gap-1 2xl:flex-col 2xl:gap-0'>
        <div className='flex w-full items-center justify-between gap-2'>
          <Box className={cn('flex w-full rounded-lg bg-neutral-900 !py-1.5 !pl-4', className)}>
            <NewTextSubHeading>{t('Pool Attributes')}</NewTextSubHeading>
          </Box>

          <div className='hidden items-center 2xl:flex'>
            <i
              onClick={() => setShow(!show)}
              className={cn(
                'flex cursor-pointer items-center justify-center rounded-lg',
                'size-11 min-w-11',
                show ? 'bg-neutral-600' : 'bg-neutral-900',
              )}
            >
              <InfoIcon className='size-5 stroke-neutral-400' />
            </i>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 0, height: 0 }}
          animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='overflow-hidden'
        >
          <div className='mt-2 hidden 2xl:block'>
            {pair?.type === PAIR_TYPES.LSD ? (
              <>{strategy && pair && <PoolAttributesCL strategy={strategy} pool={pair} />}</>
            ) : (
              <>{pair && <NormalPoolAttributes pool={pair} />}</>
            )}
          </div>
        </motion.div>

        <div className='hidden max-2xl:block'>
          <i
            onClick={() => setShow(!show)}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg',
              'size-8 min-w-8 md:size-11 md:min-w-11',
              show ? 'bg-neutral-600' : 'bg-neutral-900',
            )}
          >
            <InfoIcon className='size-4 stroke-neutral-400 md:size-5' />
          </i>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 0, height: 0 }}
        animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='overflow-hidden'
      >
        <div className='mt-2 block 2xl:hidden'>
          {pair?.type === PAIR_TYPES.LSD ? (
            <>{strategy && pair && <PoolAttributesCL strategy={strategy} pool={pair} />}</>
          ) : (
            <>{pair && <NormalPoolAttributes pool={pair} />}</>
          )}
        </div>
      </motion.div>
    </div>
  )
}
