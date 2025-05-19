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
      <div className='flex h-8 items-end max-xl:w-full md:h-11 xl:h-11 xl:justify-end'>
        <div className='flex w-full items-center justify-between gap-2 xl:w-fit'>
          <Box
            className={cn(
              'flex h-8 items-center rounded-lg bg-neutral-900 !p-4 max-xl:w-full md:h-11 xl:h-11 xl:justify-center',
              className,
            )}
          >
            <NewTextSubHeading className='text-xs text-neutral-500 xl:!text-xl'>
              {t('Pool Attributes')}
            </NewTextSubHeading>
          </Box>

          <div className='flex items-center'>
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
      </div>

      <motion.div
        initial={{ opacity: 0, y: 0, height: 0 }}
        animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='overflow-hidden'
      >
        <div className='mt-2 w-full'>
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
