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
      <div className='flex gap-2'>
        <Box className={cn('w-full rounded-lg bg-neutral-900 py-2 lg:p-4', className)}>
          <NewTextSubHeading className='flex items-center justify-between'>
            <h3 className='text-xs font-medium md:text-lg xl:text-2xl'>{t('Pool Attributes')}</h3>
            <div className='hidden items-center lg:flex'>
              <i
                onClick={() => setShow(!show)}
                className={cn(
                  'flex cursor-pointer items-center justify-center rounded-lg',
                  'size-11 min-w-11',
                  show ? 'bg-neutral-600' : 'bg-neutral-700',
                )}
              >
                <InfoIcon className='size-5 stroke-neutral-400' />
              </i>
            </div>
          </NewTextSubHeading>

          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <div className='mt-5 hidden lg:block'>
              {pair?.type === PAIR_TYPES.LSD ? (
                <>{strategy && pair && <PoolAttributesCL strategy={strategy} pool={pair} />}</>
              ) : (
                <>{pair && <NormalPoolAttributes pool={pair} />}</>
              )}
            </div>
          </motion.div>
        </Box>

        <div className='hidden max-lg:block'>
          <i
            onClick={() => setShow(!show)}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg',
              'size-8 min-w-8 md:size-11 md:min-w-11',
              show ? 'bg-neutral-600' : 'bg-neutral-800',
            )}
          >
            <InfoIcon className='size-5 stroke-neutral-400' />
          </i>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='overflow-hidden'
      >
        <div className='mt-2 block lg:hidden'>
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
