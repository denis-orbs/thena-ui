import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Info } from '@/components/alert'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ChevronUpIcon, InfoIcon } from '@/svgs'

function WarningStartingPrice() {
  const t = useTranslations()
  const [showWarning, setShowWarning] = useState(true)

  return (
    <>
      <div className='max-xl:hidden'>
        <div className='flex justify-end'>
          <i
            onClick={() => setShowWarning(!showWarning)}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg',
              'size-8 min-w-8 md:size-11 md:min-w-11',
              showWarning ? 'bg-neutral-600' : 'bg-neutral-900',
            )}
          >
            <InfoIcon className='size-4 stroke-neutral-400 md:size-5' />
          </i>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 0, height: 0 }}
          animate={showWarning ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={cn('overflow-hidden max-xl:hidden')}
        >
          <Info className={cn('mt-2 flex-col items-start gap-0 px-5 py-4 xl:gap-1')}>
            <div className='flex w-full items-center gap-4'>
              <InfoIcon className='stroke-primary-600! size-5 min-w-5' />

              <div className='flex w-full items-center justify-between'>
                <TextHeading className='text-primary-100 text-xl font-semibold xl:font-medium'>
                  {t('Starting Price needed')}
                </TextHeading>
              </div>
            </div>

            <div className='text-primary-100 mt-2! pl-9 text-base leading-5 xl:mt-0!'>{t('Initialize warning')}</div>
          </Info>
        </motion.div>
      </div>

      <Info className={cn('mt-4 flex-col items-start gap-0 px-3 py-2 md:px-5 md:py-4 xl:hidden')}>
        <div className='flex w-full items-center gap-2 md:gap-4'>
          <InfoIcon className='stroke-primary-600! size-4 min-w-4 md:size-5 md:min-w-5' />

          <div className='flex w-full items-center justify-between'>
            <TextHeading className='text-primary-100 text-xl font-semibold'>{t('Starting Price needed')}</TextHeading>
            <ChevronUpIcon
              className={cn(
                'size-4 min-w-4 cursor-pointer transition-all duration-300 ease-in-out md:size-7 md:min-w-7 md:p-1',
                !showWarning && 'rotate-180',
              )}
              onClick={() => setShowWarning(show => !show)}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 0, height: 0 }}
          animate={showWarning ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={cn('overflow-hidden xl:hidden')}
        >
          <div className='text-primary-100 mt-2! pl-6 text-base leading-5 md:pl-9'>{t('Initialize warning')}</div>
        </motion.div>
      </Info>
    </>
  )
}

export default WarningStartingPrice
