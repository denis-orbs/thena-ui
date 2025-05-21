import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Info } from '@/components/alert'
import { Paragraph } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ChevronUpIcon, InfoIcon } from '@/svgs'

function WarningStartingPrice() {
  const t = useTranslations()
  const [showWarning, setShowWarning] = useState(true)

  return (
    <Info className={cn('flex-col items-start gap-0 px-3 py-2')}>
      <div className='flex w-full items-center gap-2 md:gap-4'>
        <InfoIcon className='size-4 !stroke-primary-600 md:size-8' />

        <div className='flex w-full items-start justify-between md:items-center'>
          <Paragraph className='text-xl font-semibold text-primary-100'>{t('Starting Price needed')}</Paragraph>
          <ChevronUpIcon
            className={cn(
              'w-7 min-w-7 cursor-pointer p-1 transition-all duration-300 ease-in-out md:w-9 md:min-w-9 md:p-2',
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
        className={cn('overflow-hidden')}
      >
        <div className='!mt-2 pl-6 text-base leading-5 text-primary-100 md:!mt-4 md:pl-12'>
          {t('Initialize warning')}
        </div>
      </motion.div>
    </Info>
  )
}

export default WarningStartingPrice
