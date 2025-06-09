import { useTranslations } from 'use-intl'

import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'
import { CoinUSDIcon } from '@/svgs'

export default function ManualPositionInfo({ baseCurrency, quoteCurrency, position }) {
  const t = useTranslations()

  return (
    <div className='mt-4 md:mt-0 xl:space-y-2'>
      <TextHeading className='!text-xl !leading-6 max-md:hidden'>{t('Your Deposit')}</TextHeading>
      <article
        className={cn(
          'grid grid-cols-2 items-center gap-4 rounded-lg bg-neutral-900 p-2 font-medium md:grid-cols-3 md:p-4',
        )}
      >
        <div className='col-span-2 flex flex-row gap-2 max-md:items-center md:col-span-1 md:flex-col lg:justify-start'>
          <div className='flex gap-2'>
            <div className='size-6 min-w-6 md:size-8 md:min-w-8'>
              <CoinUSDIcon className='size-full' />
            </div>
            <Paragraph className='text-primary-100 text-xs max-md:hidden md:!text-xl'>
              ${position.depositInUSD}
            </Paragraph>
          </div>
          <div className='flex flex-col max-md:gap-1'>
            <Paragraph className='text-primary-100 text-xs md:hidden md:!text-xl'>${position.depositInUSD}</Paragraph>
            <Paragraph className='text-primary-100 text-xs text-nowrap md:!text-base md:!leading-5'>
              {t('Deposit Value in USD')}
            </Paragraph>
          </div>
        </div>

        <div className='flex flex-row gap-2 max-md:items-center md:flex-col lg:justify-start'>
          <div className='flex gap-2'>
            <CircleImage
              className='size-6 min-w-6 md:size-8 md:min-w-8'
              src={baseCurrency.logoURI ?? UNKNOWN_LOGO}
              alt='base token'
            />
            <Paragraph className='text-primary-100 text-xs max-md:hidden md:!text-xl'>
              {formatAmount(position.amountAsset0)}
            </Paragraph>
          </div>
          <div className='flex flex-col max-md:gap-1'>
            <Paragraph className='text-primary-100 text-xs md:hidden md:!text-xl'>
              {formatAmount(position.amountAsset0)}
            </Paragraph>
            <Paragraph className='text-primary-100 text-xs text-nowrap md:!text-base md:!leading-5'>
              {t('[symbol] deposit [percent]', {
                symbol: baseCurrency.symbol,
                percent: formatAmount(position.firstPercent),
              })}
            </Paragraph>
          </div>
        </div>

        <div className='flex flex-row gap-2 max-md:items-center md:flex-col md:items-end'>
          <div className='flex gap-2'>
            <CircleImage
              className='size-6 min-w-6 md:size-8 md:min-w-8'
              src={quoteCurrency.logoURI ?? UNKNOWN_LOGO}
              alt='quote token'
            />
            <Paragraph className='text-primary-100 text-xs max-md:hidden md:!text-xl'>
              {formatAmount(position.amountAsset1)}
            </Paragraph>
          </div>
          <div className='flex flex-col max-md:gap-1'>
            <Paragraph className='text-primary-100 text-xs md:hidden md:!text-xl'>
              {formatAmount(position.amountAsset1)}
            </Paragraph>
            <Paragraph className='text-primary-100 text-xs text-nowrap md:!text-base md:!leading-5'>
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
