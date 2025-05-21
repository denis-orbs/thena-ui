import { useTranslations } from 'use-intl'

import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'
import { CoinUSDIcon } from '@/svgs'

export default function ManualPositionInfo({ baseCurrency, quoteCurrency, position }) {
  const t = useTranslations()

  return (
    <div className='mt-4 md:mt-0'>
      <article
        className={cn(
          'gird-cols-2 grid items-center gap-4 rounded-lg bg-neutral-900 p-2 font-medium md:grid-cols-3 md:p-4',
        )}
      >
        <div className='col-span-2 flex items-center gap-2 md:col-span-1 lg:justify-start'>
          <div className='size-6 min-w-6 md:size-16 md:min-w-16'>
            <CoinUSDIcon className='size-full' />
          </div>
          <div className='flex flex-col gap-2'>
            <Paragraph className='text-xs text-primary-100 md:text-xl'>${position.depositInUSD}</Paragraph>
            <Paragraph className='text-xs text-primary-100 md:text-base'>{t('Deposit Value in USD')}</Paragraph>
          </div>
        </div>

        <div className='flex items-center gap-2 lg:justify-start'>
          <CircleImage className='size-6 md:size-16' src={baseCurrency.logoURI ?? UNKNOWN_LOGO} alt='base token' />
          <div className='flex flex-col gap-2'>
            <Paragraph className='text-xs text-primary-100 md:text-xl'>{formatAmount(position.amountAsset0)}</Paragraph>
            <Paragraph className='text-xs text-primary-100 md:text-base'>
              {t('[symbol] deposit [percent]', {
                symbol: baseCurrency.symbol,
                percent: formatAmount(position.firstPercent),
              })}
            </Paragraph>
          </div>
        </div>

        <div className='flex items-center gap-2 lg:justify-start'>
          <CircleImage className='size-6 md:size-16' src={quoteCurrency.logoURI ?? UNKNOWN_LOGO} alt='base token' />
          <div className='flex flex-col gap-2'>
            <Paragraph className='text-xs text-primary-100 md:text-xl'>{formatAmount(position.amountAsset1)}</Paragraph>
            <Paragraph className='text-xs text-primary-100 md:text-base'>
              {t('[symbol] deposit [percent]', {
                symbol: quoteCurrency.symbol,
                percent: formatAmount(100 - position.firstPercent),
              })}
            </Paragraph>
          </div>
        </div>
      </article>

      <div className='mt-8 flex flex-col gap-2 lg:flex-row'>
        <div className='flex w-full flex-col gap-2'>
          <Paragraph className='text-xs text-neutral-500'>
            {t('Min [symbolA] per [symbolB] price', {
              symbolA: baseCurrency.symbol,
              symbolB: quoteCurrency.symbol,
            })}
          </Paragraph>
          <div className={cn('flex flex-col rounded-xl border border-neutral-700 px-4 py-3')}>
            <TextHeading className='text-xl leading-7 text-neutral-400'>{position.minPrice}</TextHeading>
          </div>
        </div>

        <div className='flex w-full flex-col gap-2'>
          <Paragraph className='text-xs text-neutral-500'>
            {t('Max [symbolA] per [symbolB] price', {
              symbolA: baseCurrency.symbol,
              symbolB: quoteCurrency.symbol,
            })}
          </Paragraph>
          <div className={cn('flex flex-col rounded-xl border border-neutral-700 px-4 py-3')}>
            <TextHeading className='text-xl leading-7 text-neutral-400'>{position.maxPrice}</TextHeading>
          </div>
        </div>
      </div>
    </div>
  )
}
