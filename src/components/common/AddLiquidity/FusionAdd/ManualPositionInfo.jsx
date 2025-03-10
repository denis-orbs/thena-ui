import { useTranslations } from 'use-intl'

import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'
import { CoinUSDIcon } from '@/svgs'

export default function ManualPositionInfo({ baseCurrency, quoteCurrency, position }) {
  const t = useTranslations()

  return (
    <div className='mt-8'>
      <article
        className={cn('gird-cols-6 grid items-center gap-4 rounded-lg bg-neutral-900 p-4 font-medium md:grid-cols-3')}
      >
        <div className='flex items-center justify-center gap-6 md:gap-2 lg:justify-start'>
          <div className='size-12 min-w-12 2xl:size-16 2xl:min-w-16'>
            <CoinUSDIcon className='size-full' />
          </div>
          <div className='flex min-w-40 flex-col gap-2 md:min-w-0'>
            <Paragraph className='text-base text-primary-100 2xl:text-xl'>${position.depositInUSD}</Paragraph>
            <Paragraph className='text-sm text-primary-100 2xl:text-base'>{t('Deposit Value in USD')}</Paragraph>
          </div>
        </div>

        <div className='flex items-center justify-center gap-6 md:gap-2 lg:justify-start'>
          <CircleImage className='size-12 2xl:size-16' src={baseCurrency.logoURI ?? UNKNOWN_LOGO} alt='base token' />
          <div className='flex min-w-40 flex-col gap-2 md:min-w-0'>
            <Paragraph className='text-base text-primary-100 2xl:text-xl'>
              {formatAmount(position.amountAsset0)}
            </Paragraph>
            <Paragraph className='text-sm text-primary-100 2xl:text-base'>
              {t('[symbol] deposit [percent]', {
                symbol: baseCurrency.symbol,
                percent: formatAmount(position.firstPercent),
              })}
            </Paragraph>
          </div>
        </div>

        <div className='flex items-center justify-center gap-6 md:gap-2 lg:justify-start'>
          <CircleImage className='size-12 2xl:size-16' src={quoteCurrency.logoURI ?? UNKNOWN_LOGO} alt='base token' />
          <div className='flex min-w-40 flex-col gap-2 md:min-w-0'>
            <Paragraph className='text-base text-primary-100 2xl:text-xl'>
              {formatAmount(position.amountAsset1)}
            </Paragraph>
            <Paragraph className='text-sm text-primary-100 2xl:text-base'>
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
          <div className={cn('flex flex-col rounded-xl border border-neutral-700 px-4 py-3 text-neutral-400')}>
            <TextHeading>{position.minPrice}</TextHeading>
          </div>
        </div>

        <div className='flex w-full flex-col gap-2'>
          <Paragraph className='text-xs text-neutral-500'>
            {t('Max [symbolA] per [symbolB] price', {
              symbolA: baseCurrency.symbol,
              symbolB: quoteCurrency.symbol,
            })}
          </Paragraph>
          <div className={cn('flex flex-col rounded-xl border border-neutral-700 px-4 py-3 text-neutral-400')}>
            <TextHeading>{position.maxPrice}</TextHeading>
          </div>
        </div>
      </div>
    </div>
  )
}
