import { useTranslations } from 'next-intl'
import React from 'react'
import { zeroAddress } from 'viem'

import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { THENACOLORS } from '@/constant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useGaugeBalance, useWeightPoolData } from '@/hooks/weightedPool/useWeigtedPool'
import { cn, formatAmount, unwrappedSymbol } from '@/lib/utils'
import PieChart from '@/modules/WeightedPool/PieChart'
import { TargetIcon } from '@/svgs'

export function TokenAnalytics({ pair, classNames }) {
  const { tokens } = pair || {}
  const t = useTranslations()
  return (
    <div className={cn('grid grid-cols-1 gap-2 md:gap-4 lg:grid-cols-2', tokens?.length === 2 && 'md:grid-cols-2')}>
      {(tokens || []).map((token, index) => (
        <div className={cn('flex flex-col gap-4 rounded-md bg-neutral-900 p-4', classNames?.items)} key={token.address}>
          <div className='flex justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <CircleImage className='size-7' alt='weighted token logo' src={token.logoURI} />
              <TextHeading className='font-archia text-xl font-semibold text-neutral-50'>{token.symbol}</TextHeading>
            </div>
            <TextHeading className='font-archia text-xl font-semibold text-neutral-50'>
              ${formatAmount(parseFloat(token.reserve) * token.price)}
            </TextHeading>
          </div>
          <div className='flex flex-col gap-1'>
            <div className='flex justify-between gap-4'>
              <TextSubHeading className='text-xs'>{`${t('Pool')} %`}</TextSubHeading>
              <div className='flex gap-2'>
                <TargetIcon className='size-4' />
                <TextSubHeading className='text-xs'>{`${t('Target')} ${token.weight}%`}</TextSubHeading>
              </div>
            </div>
            <div className='relative h-9 w-full overflow-hidden rounded-r-sm bg-neutral-800'>
              {/* Progress fill */}
              <div
                className={cn('h-full rounded-none rounded-r-sm', !parseFloat(token.reserve) && 'bg-transparent')}
                style={{
                  width:
                    (parseFloat(token.reserve) * token.price * 100) / pair.tvlUSD < 1
                      ? '1px'
                      : `${(parseFloat(token.reserve) * token.price * 100) / pair.tvlUSD}%`,
                  backgroundColor: THENACOLORS[index],
                }}
              />
              <div className='absolute top-0 bottom-0 h-full'>
                <TextHeading className='absolute items-center p-2 text-nowrap text-neutral-950'>
                  {formatAmount((parseFloat(token.reserve) * token.price * 100) / pair.tvlUSD)} %
                </TextHeading>
              </div>
              {/* Target line */}
              <div
                className='absolute top-0 bottom-0 w-0.5 border border-dashed border-neutral-700'
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
  const { balance: poolBalance, isLoading: loadingPoolBalance } = useWeightPoolData(pair ? pair.address : null)
  const { gaugeBalance, isLoading: loadingGaugeBalance } = useGaugeBalance(pair ? pair.gauge.address : zeroAddress)
  const { isLgDown } = useMediaQuery()

  const t = useTranslations()
  return (
    <div className='flex flex-col gap-2 md:gap-4'>
      <TextHeading className='hidden text-2xl! font-medium lg:block'>{t('Pool Attributes')}</TextHeading>
      <div className='flex flex-col gap-4 lg:flex-row'>
        <div
          className={cn(
            'order-2 flex flex-col rounded-xl lg:order-1 lg:w-[40%]',
            !isLgDown && 'bg-gradient-purple-dark min-h-[576px] border border-neutral-600',
          )}
        >
          <div className='relative hidden pt-[80px] pb-[48px] lg:flex'>
            <PieChart tokens={tokens} showTotalPercent={false} className='mx-auto size-[204px]' />
            <div className='absolute top-[50%] left-[50%] h-[72px] w-[132px] translate-x-[-50%] translate-y-[-50%] p-5 text-center'>
              <TextHeading>{`${t('Pool Fees')} ${formatAmount(pair.fee)}%`}</TextHeading>
            </div>
          </div>
          <div className='flex max-h-[224px] flex-col px-4 pb-4'>
            <div className='flex flex-col gap-4'>
              <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
              <div className='flex max-h-[52px] flex-col gap-3 overflow-y-auto'>
                {(tokens || []).map(token => (
                  <div key={token.address} className='flex items-center justify-between'>
                    <Paragraph className='leading-5! font-normal'>
                      {unwrappedSymbol(token)} {t('Amount')}
                    </Paragraph>
                    <Paragraph className='leading-5! font-normal'>{formatAmount(token.reserve)}</Paragraph>
                  </div>
                ))}
              </div>
            </div>
            <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
              <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <Paragraph className='leading-5! font-normal'>{t('Pooled Liquidity')}</Paragraph>
                  {loadingPoolBalance ? (
                    <Skeleton className='h-5 w-20' />
                  ) : (
                    <Paragraph className='leading-5!'>{formatAmount(poolBalance)} LP</Paragraph>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <Paragraph className='leading-5! font-normal'>{t('Staked Liquidity')}</Paragraph>
                  {loadingGaugeBalance ? (
                    <Skeleton className='h-5 w-20' />
                  ) : (
                    <Paragraph className='leading-5! font-normal'>{formatAmount(gaugeBalance)} LP</Paragraph>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='order-1 w-full lg:order-2 lg:w-[60%]'>
          <TokenAnalytics pair={pair} classNames={{ items: 'max-lg:bg-transparent' }} />
        </div>
      </div>
    </div>
  )
}

export default PoolAttributesAnalytic
