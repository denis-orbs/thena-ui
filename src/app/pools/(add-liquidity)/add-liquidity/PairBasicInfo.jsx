import BigNumber from 'bignumber.js'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { NewTextSubHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useVaults } from '@/context/vaultsContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn, formatAmount } from '@/lib/utils'
import { ChevronRightIcon } from '@/svgs'

export function PairBasicInfo({ pair }) {
  const t = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  const { isMdDown } = useMediaQuery()

  const vaults = useVaults()
  const computedPair = useMemo(() => {
    const singleSideVault = vaults.find(v => v.algebra === pair?.address)
    if (singleSideVault) {
      const aprs = pair.subpools.map(sub => sub.gauge.apr).filter(item => !item.isZero())
      const aprMin = BigNumber.min(...aprs)
      const aprMax = BigNumber.max(...aprs)

      return {
        ...pair,
        apr: aprMin.isEqualTo(aprMax)
          ? `${formatAmount(aprMin)}%`
          : `${formatAmount(aprMin)}% ~ ${formatAmount(aprMax)}%`,
        tvlUSD: singleSideVault
          ? BigNumber(singleSideVault.gauge?.tvl || 0)
              .plus(BigNumber(pair.tvlUSD))
              .toNumber()
          : pair.tvlUSD,
      }
    }
    return pair
  }, [pair, vaults])

  return (
    <div className='flex justify-between gap-2'>
      <Box
        className={cn(
          'w-full justify-between gap-x-4 border border-neutral-600 !py-3 px-4 max-md:grid max-md:grid-cols-2 md:flex',
          !isMdDown && 'gap-y-4',
        )}
      >
        <div className='flex flex-col gap-2 md:gap-1'>
          <NewTextSubHeading className='text-gradient-primary text-lg md:text-xl md:leading-6'>
            {computedPair?.apr ?? '0%'}
          </NewTextSubHeading>
          <Paragraph className='text-sm text-neutral-500 md:text-base xl:text-neutral-300'>
            {pair?.type === PAIR_TYPES.LSD ? t('Estimated APR Range') : t('Estimated APR')}
          </Paragraph>
        </div>
        <div className='flex flex-col gap-2 md:gap-1'>
          <NewTextSubHeading className='text-gradient-primary text-lg md:text-xl md:leading-6'>
            ${formatAmount(pair?.dayVolume)}
          </NewTextSubHeading>
          <Paragraph className='text-sm text-neutral-500 md:text-base xl:text-neutral-300'>
            {t('Volume (24h)')}
          </Paragraph>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 0, height: 0 }}
          animate={isExpanded ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className='col-span-2 overflow-hidden bg-neutral-900 md:hidden'
        >
          <div className={cn('mt-4 grid grid-cols-2 gap-4')}>
            <div className='flex flex-col gap-2 md:gap-1'>
              <NewTextSubHeading className='text-gradient-primary text-lg md:text-xl md:leading-6'>
                ${formatAmount(pair?.dayFees)}
              </NewTextSubHeading>
              <Paragraph className='text-sm text-neutral-500 md:text-base xl:text-neutral-300'>
                {t('Fees (24h)')}
              </Paragraph>
            </div>
            <div className='flex flex-col gap-2 md:gap-1'>
              <NewTextSubHeading className='text-gradient-primary text-lg md:text-xl md:leading-6'>
                ${formatAmount(computedPair?.tvlUSD)}
              </NewTextSubHeading>
              <Paragraph className='text-sm text-neutral-500 md:text-base xl:text-neutral-300'>{t('TVL')}</Paragraph>
            </div>
          </div>
        </motion.div>

        <div className='flex flex-col gap-2 max-md:hidden md:gap-1'>
          <NewTextSubHeading className='text-gradient-primary text-lg md:text-xl md:leading-6'>
            ${formatAmount(pair?.dayFees)}
          </NewTextSubHeading>
          <Paragraph className='text-sm text-neutral-500 md:text-base xl:text-neutral-300'>{t('Fees (24h)')}</Paragraph>
        </div>

        <div className='flex flex-col gap-2 max-md:hidden md:gap-1'>
          <NewTextSubHeading className='text-gradient-primary text-lg md:text-xl md:leading-6'>
            ${formatAmount(computedPair?.tvlUSD)}
          </NewTextSubHeading>
          <Paragraph className='text-sm text-neutral-500 md:text-base xl:text-neutral-300'>{t('TVL')}</Paragraph>
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
