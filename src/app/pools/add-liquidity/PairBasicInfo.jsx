import { useTranslations } from 'next-intl'

import Box from '@/components/box'
import { NewTextSubHeading, Paragraph } from '@/components/typography'
import { formatAmount } from '@/lib/utils'

export function PairBasicInfo({ pair }) {
  const t = useTranslations()

  return (
    <Box className='grid grid-cols-2 flex-wrap justify-between gap-4 md:flex'>
      <div className='flex flex-col gap-2'>
        <NewTextSubHeading className='text-gradient-primary'>{pair?.apr ?? '0%'}</NewTextSubHeading>
        <Paragraph>{t('APR')}</Paragraph>
      </div>
      <div className='flex flex-col gap-2'>
        <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayVolume)}</NewTextSubHeading>
        <Paragraph>{t('Volume (24h)')}</Paragraph>
      </div>
      <div className='flex flex-col gap-2'>
        <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.dayFees)}</NewTextSubHeading>
        <Paragraph>{t('Fees (24h)')}</Paragraph>
      </div>
      <div className='flex flex-col gap-2'>
        <NewTextSubHeading className='text-gradient-primary'>${formatAmount(pair?.tvlUSD)}</NewTextSubHeading>
        <Paragraph>{t('TVL')}</Paragraph>
      </div>
    </Box>
  )
}
