import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { NewTextSubHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn, formatAmount } from '@/lib/utils'
import { ChevronRightIcon } from '@/svgs'

export function PairBasicInfo({ pair }) {
  const t = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  const { isMdDown } = useMediaQuery()

  return (
    <div className='flex justify-between gap-2'>
      <Box
        className={cn(
          'w-full justify-between gap-x-4 !py-3 px-4 max-md:grid max-md:grid-cols-2 md:flex',
          !isMdDown && 'gap-y-4',
        )}
      >
        <div className='flex flex-col gap-2 md:gap-3'>
          <NewTextSubHeading className='text-gradient-primary text-lg'>{pair?.apr ?? '0%'}</NewTextSubHeading>
          <Paragraph className='text-sm text-neutral-500'>
            {pair?.type === PAIR_TYPES.LSD ? t('Estimated APR Range') : t('Estimated APR')}
          </Paragraph>
        </div>
        <div className='flex flex-col gap-2 md:gap-3'>
          <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayVolume)}</NewTextSubHeading>
          <Paragraph className='text-sm text-neutral-500'>{t('Volume (24h)')}</Paragraph>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 0, height: 0 }}
          animate={isExpanded ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='col-span-2 overflow-hidden bg-neutral-900 md:hidden'
        >
          <div className={cn('mt-4 grid grid-cols-2 gap-4')}>
            <div className='flex flex-col gap-2 md:gap-3'>
              <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayFees)}</NewTextSubHeading>
              <Paragraph className='text-sm text-neutral-500'>{t('Fees (24h)')}</Paragraph>
            </div>
            <div className='flex flex-col gap-2 md:gap-3'>
              <NewTextSubHeading className='text-gradient-primary'>{formatAmount(pair?.reserve0)}</NewTextSubHeading>
              <Paragraph className='text-sm text-neutral-500'>
                {t('Total [symbol] Locked', {
                  symbol: pair?.token0?.symbol,
                })}
              </Paragraph>
            </div>
            <div className='flex flex-col gap-2 md:gap-3'>
              <NewTextSubHeading className='text-gradient-primary'>{formatAmount(pair?.reserve1)}</NewTextSubHeading>
              <Paragraph className='text-sm text-neutral-500'>
                {t('Total [symbol] Locked', {
                  symbol: pair?.token1?.symbol,
                })}
              </Paragraph>
            </div>
          </div>
        </motion.div>

        <div className='flex flex-col gap-2 max-md:hidden md:gap-3'>
          <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayFees)}</NewTextSubHeading>
          <Paragraph className='text-sm text-neutral-500'>{t('Fees (24h)')}</Paragraph>
        </div>

        <div className='flex flex-col gap-2 max-md:hidden md:gap-3'>
          <NewTextSubHeading className='text-gradient-primary'>{formatAmount(pair?.reserve0)}</NewTextSubHeading>
          <Paragraph className='text-sm text-neutral-500'>
            {t('Total [symbol] Locked', {
              symbol: pair?.token0?.symbol,
            })}
          </Paragraph>
        </div>

        <div className='flex flex-col gap-2 max-md:hidden md:gap-3'>
          <NewTextSubHeading className='text-gradient-primary'>{formatAmount(pair?.reserve1)}</NewTextSubHeading>
          <Paragraph className='text-sm text-neutral-500'>
            {t('Total [symbol] Locked', {
              symbol: pair?.token1?.symbol,
            })}
          </Paragraph>
        </div>
      </Box>

      <EmphasisButton
        className='size-8 !bg-neutral-900 p-2 outline-0 md:hidden'
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <ChevronRightIcon className={cn('size-4 [&>path]:stroke-neutral-400', isExpanded && '-rotate-90')} />
      </EmphasisButton>
    </div>
  )
}
