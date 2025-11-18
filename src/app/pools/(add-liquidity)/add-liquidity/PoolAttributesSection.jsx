import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import Box from '@/components/box'
import { NewTextHeading, NewTextSubHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import InfoIcon from '@/icons/InfoIcon'
import { NormalPoolAttributes, PoolAttributesCL } from '@/modules/Pools/PoolAttributes'
import cn from '@/utils/classes'

export function PoolAttributesSection({ strategy, pair, className }) {
  const t = useTranslations()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!pair) setShow(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pair)])

  return (
    <div className='flex w-full flex-col'>
      <div className='flex h-8 items-end md:h-11 xl:h-11 xl:justify-end'>
        <div className='flex w-full items-center justify-between gap-2'>
          <Box className={cn('flex h-8 items-center rounded-lg bg-neutral-900 p-4! md:h-11 xl:h-11', className)}>
            <NewTextSubHeading className='text-xs xl:text-sm! xl:text-neutral-300'>
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
              <InfoIcon className='md:size-5' />
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
        <div className='mt-2 w-full xl:mt-4'>
          {pair ? (
            <>
              {pair?.type === PAIR_TYPES.LSD ? (
                <>{strategy && pair && <PoolAttributesCL strategy={strategy} pool={pair} />}</>
              ) : (
                <>{pair && <NormalPoolAttributes pool={pair} />}</>
              )}
            </>
          ) : (
            <div className='flex h-max flex-col gap-3 rounded-md bg-neutral-800 p-4'>
              <NewTextHeading className='text-xl!'>{t('New Deposit')}</NewTextHeading>
              <Paragraph className='leading-5 font-medium'>{t('New Deposit CL description')}</Paragraph>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
