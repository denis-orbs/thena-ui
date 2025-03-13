import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { NewTextSubHeading, Paragraph } from '@/components/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn, formatAmount } from '@/lib/utils'
import { ChevronRightIcon } from '@/svgs'

import { PoolAttributesSection } from './PoolAttributesSection'

export function PairBasicInfo({ pair }) {
  const t = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  const { isMdDown } = useMediaQuery()

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between gap-2'>
        <Box className={cn('w-full justify-between !py-3 px-4 md:flex', !isMdDown && 'gap-4')}>
          <div className='grid grid-cols-2 gap-4 md:w-1/2'>
            <div className='flex flex-col gap-2 md:gap-3'>
              <NewTextSubHeading className='text-gradient-primary text-lg'>{pair?.apr ?? '0%'}</NewTextSubHeading>
              <Paragraph className='text-sm text-neutral-500'>{t('Estimated APR')}</Paragraph>
            </div>
            <div className='flex flex-col gap-2 md:gap-3'>
              <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayVolume)}</NewTextSubHeading>
              <Paragraph className='text-sm text-neutral-500'>{t('Volume (24h)')}</Paragraph>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 0, height: 0 }}
            animate={isExpanded ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='w-full overflow-hidden bg-neutral-900 md:hidden'
          >
            <div className={cn('mt-4 grid grid-cols-2 gap-4')}>
              <div className='flex flex-col gap-2 md:gap-3'>
                <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayFees)}</NewTextSubHeading>
                <Paragraph className='text-sm text-neutral-500'>{t('Fees (24h)')}</Paragraph>
              </div>
              <div className='flex flex-col gap-2 md:gap-3'>
                <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.tvlUSD)}</NewTextSubHeading>
                <Paragraph className='text-sm text-neutral-500'>{t('TVL')}</Paragraph>
              </div>
            </div>
          </motion.div>

          <div className='grid w-1/2 grid-cols-2 gap-4'>
            <div className='flex flex-col gap-2 max-md:hidden md:gap-3'>
              <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayFees)}</NewTextSubHeading>
              <Paragraph className='text-sm text-neutral-500'>{t('Fees (24h)')}</Paragraph>
            </div>
            <div className='flex flex-col gap-2 max-md:hidden md:gap-3'>
              <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.tvlUSD)}</NewTextSubHeading>
              <Paragraph className='text-sm text-neutral-500'>{t('TVL')}</Paragraph>
            </div>
          </div>
        </Box>

        <EmphasisButton className='size-8 !bg-neutral-800 p-2 md:hidden' onClick={() => setIsExpanded(prev => !prev)}>
          <ChevronRightIcon className={cn('size-4 [&>path]:stroke-neutral-400', isExpanded && 'rotate-90')} />
        </EmphasisButton>
      </div>

      <div className='block lg:hidden'>
        <PoolAttributesSection pair={pair} />
      </div>
    </div>
  )
}
