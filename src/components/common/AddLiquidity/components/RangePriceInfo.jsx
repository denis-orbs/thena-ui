import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { Paragraph, TextHeading } from '@/components/typography'
import { Bound, updateIsReverse } from '@/state/fusion/actions'
import cn from '@/utils/classes'
import { formatAmountLP } from '@/utils/utils'

import ReverseIcon from '~/svgs/reverse.svg'

function RangePriceInfo({ baseCurrency, quoteCurrency, position }) {
  const t = useTranslations()
  const { ticksAtLimit } = position || {}

  const isFullRange = useMemo(
    () => (ticksAtLimit ? ticksAtLimit[Bound.LOWER] && ticksAtLimit[Bound.UPPER] : false),
    [ticksAtLimit],
  )
  const dispatch = useDispatch()
  const { isReverse } = useSelector(state => state.fusion)
  const handleRevert = () => {
    dispatch(updateIsReverse({ isReverse: !isReverse }))
  }
  return (
    <div className='grid grid-cols-[1fr_44px_1fr] items-end gap-2'>
      <div className='flex w-full flex-col gap-2'>
        <Paragraph className='text-base! leading-5 font-medium text-neutral-500'>
          {t('Min [symbolA] per [symbolB]', {
            symbolA: quoteCurrency?.symbol,
            symbolB: baseCurrency?.symbol,
          })}
        </Paragraph>
        <div className={cn('flex w-full max-w-[154px] flex-col overflow-hidden rounded-xl bg-neutral-700 px-3 py-3')}>
          <TextHeading className='text-base! leading-5! font-normal text-neutral-500'>
            {isFullRange ? '0' : isReverse ? formatAmountLP(1 / position.maxPrice) : formatAmountLP(position.minPrice)}
          </TextHeading>
        </div>
      </div>

      <EmphasisIconButton className='size-11! rounded-lg!' Icon={ReverseIcon} onClick={handleRevert} />

      <div className='flex w-full flex-col gap-2'>
        <Paragraph className='text-base! leading-5 font-medium text-neutral-500'>
          {t('Max [symbolA] per [symbolB]', {
            symbolA: quoteCurrency?.symbol,
            symbolB: baseCurrency?.symbol,
          })}
        </Paragraph>
        <div className={cn('flex w-full max-w-[154px] flex-col overflow-hidden rounded-xl bg-neutral-700 px-4 py-3')}>
          <TextHeading className='text-base! leading-5! font-normal text-neutral-500'>
            {isFullRange ? '∞' : isReverse ? formatAmountLP(1 / position.minPrice) : formatAmountLP(position.maxPrice)}
          </TextHeading>
        </div>
      </div>
    </div>
  )
}

export default RangePriceInfo
