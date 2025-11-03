import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Info } from '@/components/alert'
import { TextHeading } from '@/components/typography'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import InfoIcon from '@/icons/InfoIcon'
import { cn } from '@/lib/utils'

function WarningStartingPrice() {
  const t = useTranslations()
  const [showWarning, setShowWarning] = useState(true)

  return (
    <>
      <div className='max-lg:hidden'>
        <Info className={cn('flex-col items-start gap-0 py-2 pr-2 pl-3 xl:gap-1 xl:px-5 xl:py-4 xl:pl-4')}>
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
      </div>

      <Info className={cn('flex-col items-start gap-0 px-3 py-2 lg:hidden')}>
        <div className='flex w-full items-center gap-2'>
          <InfoIcon className='stroke-primary-600! size-4 min-w-4 md:size-5 md:min-w-5' />

          <div className='flex w-full items-center justify-between'>
            <TextHeading className='text-primary-100 text-xl font-semibold'>{t('Starting Price needed')}</TextHeading>
            <ChevronDownIcon
              isRevert={showWarning}
              className='stroke-primary-600! min-w-4 cursor-pointer duration-300 md:h-7 md:w-7 md:min-w-7 md:p-1'
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
