import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { Paragraph, TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { Bound } from '@/state/fusion/actions'
import { ReverseIcon } from '@/svgs'

function RangePriceInfo({ baseCurrency, quoteCurrency, position }) {
  const t = useTranslations()
  const { ticksAtLimit } = position || {}

  const isFullRange = useMemo(
    () => (ticksAtLimit ? ticksAtLimit[Bound.LOWER] && ticksAtLimit[Bound.UPPER] : false),
    [ticksAtLimit],
  )
  return (
    <div className='grid grid-cols-[1fr_44px_1fr] items-end gap-2'>
      <div className='flex w-full flex-col gap-2'>
        <Paragraph className='text-base! leading-5 font-medium text-neutral-500'>
          {t('Min [symbolA] per [symbolB]', {
            symbolA: baseCurrency?.symbol,
            symbolB: quoteCurrency?.symbol,
          })}
        </Paragraph>
        <div className={cn('flex flex-col rounded-xl bg-neutral-700 px-4 py-3')}>
          <TextHeading className='text-base! leading-5! text-neutral-400'>
            {isFullRange ? '0' : position.minPrice}
          </TextHeading>
        </div>
      </div>

      <EmphasisIconButton className='size-11! rounded-lg!' Icon={ReverseIcon} />

      <div className='flex w-full flex-col gap-2'>
        <Paragraph className='text-base! leading-5 font-medium text-neutral-500'>
          {t('Max [symbolA] per [symbolB]', {
            symbolA: baseCurrency?.symbol,
            symbolB: quoteCurrency?.symbol,
          })}
        </Paragraph>
        <div className={cn('flex flex-col rounded-xl bg-neutral-700 px-4 py-3')}>
          <TextHeading className='text-base! leading-5! text-neutral-400'>
            {isFullRange ? '∞' : position.maxPrice}
          </TextHeading>
        </div>
      </div>
    </div>
  )
}

export default RangePriceInfo
