import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import Box from '@/components/box'
import { NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { cn } from '@/lib/utils'
import { NormalPoolAttributes, PoolAttributesCL } from '@/modules/Pools/PoolAttributes'
import { InfoCircleWhite } from '@/svgs'

export function PoolAttributesSection({ strategy, pair }) {
  const t = useTranslations()
  const [show, setShow] = useState(false)

  return (
    <Box className='bg-neutral-800 py-4 lg:p-4'>
      <NewTextSubHeading className='flex items-center justify-between'>
        <h3>{t('Pool Attributes')}</h3>
        <i
          onClick={() => setShow(!show)}
          className={cn(
            'flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg ',
            show ? 'bg-neutral-600' : 'bg-neutral-700',
          )}
        >
          <InfoCircleWhite className='h-5 w-5 stroke-neutral-400' />
        </i>
      </NewTextSubHeading>

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
    </Box>
  )
}
