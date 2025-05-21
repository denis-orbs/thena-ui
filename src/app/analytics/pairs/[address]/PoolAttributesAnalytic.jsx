import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import CircleImage from '@/components/image/CircleImage'
import { NewTextSubHeading, TextHeading, TextSubHeading } from '@/components/typography'
import { useTokenColor } from '@/hooks/useTokenColor'
import { cn, formatAmount } from '@/lib/utils'
import PieChart from '@/modules/WeightedPool/PieChart'
import { TargetIcon } from '@/svgs'

function TokenAnalytics({ pair }) {
  const { tokens } = pair
  const t = useTranslations()
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-4',
        tokens.length === 2 && 'md:grid-cols-2',
      )}
    >
      <div className='hidden bg-primary-300' />
      <div className='hidden bg-primary-400' />
      <div className='hidden bg-primary-500' />
      <div className='hidden bg-primary-600' />
      <div className='hidden bg-primary-700' />
      <div className='hidden bg-primary-800' />
      <div className='hidden bg-primary-900' />
      <div className='hidden bg-primary-950' />
      {(tokens || []).map((token, index) => (
        <div className='space-y-4 rounded-md bg-neutral-900 p-4' key={token.address}>
          <div className='flex justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <CircleImage className='size-7' alt='weighted token logo' src={token.logoURI} />
              <TextHeading className='font-archia text-xl font-semibold text-neutral-50'>{token.symbol}</TextHeading>
            </div>
            <TextHeading className='font-archia text-xl font-semibold text-neutral-50'>
              ${formatAmount(parseFloat(token.reserve) * token.price)}
            </TextHeading>
          </div>
          <div className='space-y-1'>
            <div className='flex justify-between gap-4'>
              <TextSubHeading className='text-xs'>{`${t('Pool')} %`}</TextSubHeading>
              <div className='flex gap-2'>
                <TargetIcon className='size-4' />
                <TextSubHeading className='text-xs'>{`${t('Target')} ${token.weight}%`}</TextSubHeading>
              </div>
            </div>
            <div className='relative h-9 w-full overflow-hidden rounded-lg bg-neutral-800'>
              {/* Progress fill */}
              <div
                className={cn(
                  'h-full',
                  `bg-primary-${300 + index * 100 - (index === 7 ? 50 : 0)}`,
                  !parseFloat(token.reserve) && 'bg-transparent',
                )}
                style={{
                  width:
                    (parseFloat(token.reserve) * token.price * 100) / pair.tvlUSD < 1
                      ? '1px'
                      : `${(parseFloat(token.reserve) * token.price * 100) / pair.tvlUSD}%`,
                }}
              />
              <div className='absolute bottom-0 top-0 h-full'>
                <TextHeading className='absolute items-center text-nowrap p-2 text-neutral-950'>
                  {formatAmount((parseFloat(token.reserve) * token.price * 100) / pair.tvlUSD)} %
                </TextHeading>
              </div>
              {/* Target line */}
              <div
                className='absolute bottom-0 top-0 w-0.5 border border-dashed border-neutral-700'
                style={{ left: `${token.weight}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PoolAttributesAnalytic({ pair }) {
  const { tokens } = pair
  const [colors, setColors] = useState([])
  const { renderBackgroundColors } = useTokenColor()

  useEffect(() => {
    renderBackgroundColors(tokens.map(item => item.logoURI.replace('https://cdn.thena.fi/', '/logo-token/'))).then(
      result => {
        setColors(result)
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens.length, renderBackgroundColors])

  const t = useTranslations()
  return (
    <div className='flex flex-col gap-2 md:gap-4'>
      <NewTextSubHeading>{t('Pool Attributes')}</NewTextSubHeading>
      <div className='flex flex-col gap-4 lg:flex-row'>
        <div className='w-full rounded-xl bg-neutral-900 p-4 lg:w-[25%]'>
          <div className='flex justify-between gap-2'>
            <TextHeading>{t('Total Value')}</TextHeading>
            <TextHeading>${formatAmount(pair.tvlUSD)}</TextHeading>
          </div>
          <div className='relative'>
            <PieChart tokens={tokens} colors={colors} showTotalPercent={false} className='h-full' />
            <div className='absolute left-[50%] top-[50%] h-[72px] w-[132px] translate-x-[-50%] translate-y-[-50%] p-5 text-center'>
              <TextHeading>{`${t('Pool Fees')} ${formatAmount(pair.fee)}%`}</TextHeading>
            </div>
          </div>
        </div>
        <div className='w-full lg:w-[75%]'>
          <TokenAnalytics pair={pair} />
        </div>
      </div>
    </div>
  )
}

export default PoolAttributesAnalytic
