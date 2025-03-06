import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import Box from '@/components/box'
import { NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { cn } from '@/lib/utils'
import { NormalPoolAttributes, PoolAttributesCL } from '@/modules/Pools/PoolAttributes'
import { InfoCircleWhite } from '@/svgs'

export function PoolAttributesSection({ strategy, pair, className }) {
  const t = useTranslations()
  const [show, setShow] = useState(false)

  return (
    <div className='flex w-full flex-col'>
      <div className='flex gap-2'>
        <Box className={cn('w-full rounded-lg bg-neutral-900 py-4 lg:p-4', className)}>
          <NewTextSubHeading className='flex items-center justify-between'>
            <h3 className='text-xs md:text-lg'>{t('Pool Attributes')}</h3>
            <div className='hidden items-center lg:flex'>
              <i
                onClick={() => setShow(!show)}
                className={cn(
                  'flex cursor-pointer items-center justify-center rounded-lg',
                  'size-12 min-w-12',
                  show ? 'bg-neutral-600' : 'bg-neutral-700',
                )}
              >
                <InfoCircleWhite className='h-5 w-5 stroke-neutral-400' />
              </i>
            </div>
          </NewTextSubHeading>
        </Box>

        <div className='hidden max-lg:block'>
          <i
            onClick={() => setShow(!show)}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg',
              'size-8 min-w-8 md:size-12 md:min-w-12',
              show ? 'bg-neutral-600' : 'bg-neutral-700',
            )}
          >
            <InfoCircleWhite className='size-4 stroke-neutral-400 lg:size-5' />
          </i>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='overflow-hidden'
      >
        <div className='mt-5'>
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
