import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { NewTextSubHeading, Paragraph } from '@/components/typography'
import { useWindowSize } from '@/hooks/useWindowSize'
import { cn, formatAmount } from '@/lib/utils'
import { ChevronRightIcon } from '@/svgs'

export function PairBasicInfo({ pair }) {
  const t = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  const width = useWindowSize()
  const isMobile = width.width < 768
  return (
    <div className='flex justify-between gap-2'>
      <Box className='grid w-full grid-cols-2 flex-wrap justify-between gap-4 md:flex'>
        <div className='flex flex-col gap-2'>
          <NewTextSubHeading className='text-gradient-primary'>{pair?.apr ?? '0%'}</NewTextSubHeading>
          <Paragraph>{t('APR')}</Paragraph>
        </div>
        <div className='flex flex-col gap-2'>
          <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayVolume)}</NewTextSubHeading>
          <Paragraph>{t('Volume (24h)')}</Paragraph>
        </div>
        {isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={isExpanded || !isMobile ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='col-span-2 grid w-full grid-cols-2 justify-between gap-4 overflow-hidden bg-neutral-900 md:hidden'
          >
            <div className='flex flex-col gap-2'>
              <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayFees)}</NewTextSubHeading>
              <Paragraph>{t('Fees (24h)')}</Paragraph>
            </div>
            <div className='flex flex-col gap-2'>
              <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.tvlUSD)}</NewTextSubHeading>
              <Paragraph>{t('TVL')}</Paragraph>
            </div>
          </motion.div>
        )}
        <div className='flex flex-col gap-2 max-md:hidden'>
          <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayFees)}</NewTextSubHeading>
          <Paragraph>{t('Fees (24h)')}</Paragraph>
        </div>
        <div className='flex flex-col gap-2 max-md:hidden'>
          <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.tvlUSD)}</NewTextSubHeading>
          <Paragraph>{t('TVL')}</Paragraph>
        </div>
      </Box>
      {isMobile && (
        <EmphasisButton className='h-8 w-8 p-2 md:hidden' onClick={() => setIsExpanded(prev => !prev)}>
          <ChevronRightIcon className={cn('size-4', isExpanded && 'rotate-90')} />
        </EmphasisButton>
      )}
    </div>
  )
}
