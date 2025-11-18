import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React from 'react'

import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { formatAmount } from '@/utils/utils'

import EmptyShow from './EmptyShow'
import { calculateProfitPerDay, normalizeAssetUrl } from '../../lib/utils'
import BorderGradient from '../../StudioLayout/BorderGradient'

function PortfolioPreview({ state }) {
  const t = useTranslations()
  const { amount, pair } = state
  const maxApr = (pair?.subpools || []).reduce(
    (max, item) => (item.gauge.apr.gt(max) ? item.gauge.apr : max),
    new BigNumber(0),
  )

  return pair ? (
    <div className='mt-20 flex flex-col gap-[45px]'>
      <div className='flex flex-col items-center justify-center gap-3 text-center'>
        <TextHeading className='text-[32px]! leading-10! font-semibold'>
          {t('Your [amount] Can Earn', { amount: `$${formatAmount(amount, true)}` })}
        </TextHeading>
        <TextHeading
          className='font-archia text-[164px]! leading-[170px]! font-semibold tracking-[0.02em]'
          style={{ color: '#D642DB' }}
        >
          ${formatAmount(calculateProfitPerDay(maxApr, amount), true)}
        </TextHeading>
        <div className='flex w-fit items-center gap-3.5'>
          <TextHeading className='text-[32px]! leading-10! font-semibold'>{t('Per Day on')}</TextHeading>
          <div className='flex items-center justify-center gap-[5px]'>
            {pair.type === PAIR_TYPES.WEIGHTED ? (
              <ThreeIconGroup
                className='*:not-first:-ml-1'
                classNames={{
                  image: 'w-9 h-9 text-xl font-medium leading-5 text-[#1C2027]',
                }}
                logo1={normalizeAssetUrl(pair?.tokens?.[0].logoURI ?? UNKNOWN_LOGO)}
                logo2={normalizeAssetUrl(pair?.tokens?.[1].logoURI ?? UNKNOWN_LOGO)}
                extendNumber={(pair?.tokens?.length || 2) - 2}
              />
            ) : (
              <IconGroup
                classNames={{
                  image: 'outline-none w-9 h-9',
                }}
                className='*:not-first:-ml-[10px]'
                logo1={normalizeAssetUrl(pair?.token0?.logoURI ?? UNKNOWN_LOGO)}
                logo2={normalizeAssetUrl(pair?.token1?.logoURI ?? UNKNOWN_LOGO)}
                style={{ border: '3px solid rgba(26, 13, 31, 0.2)' }}
              />
            )}
            <div className='flex items-center gap-1.5'>
              <TextHeading className='text-[32px]! leading-10!'>{pair.symbol}</TextHeading>
              <Paragraph className='text-lg! leading-[27px]!'>{t(pair.type)}</Paragraph>
            </div>
          </div>
        </div>
      </div>
      <div className='relative mx-auto flex w-fit flex-col gap-1 px-[54px] pt-4 pb-4.5 text-center tracking-[.0625em]'>
        <BorderGradient />
        <TextHeading className='text-lg! leading-4.5! font-normal tracking-[.0625em] text-neutral-300 uppercase'>
          {t('Estimated APR')}
        </TextHeading>
        <TextHeading className='text-2xl! leading-6! font-medium tracking-[.0625em]'>{pair.apr} APR</TextHeading>
      </div>
    </div>
  ) : (
    <EmptyShow />
  )
}

export default PortfolioPreview
