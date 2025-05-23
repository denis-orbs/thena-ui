import { useTranslations } from 'next-intl'
import React from 'react'
import { zeroAddress } from 'viem'

import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading } from '@/components/typography'
import { useGaugeBalance, useWeightPoolData } from '@/hooks/weightedPool/useWeigtedPool'
import { cn, formatAmount, unwrappedSymbol } from '@/lib/utils'

import PieChart from './PieChart'

const colors = ['#F199EE', '#EA66E5', '#E333DD', '#DC00D4', '#B000AA', '#84007F', '#580055', '#32002F']

function LiquidityPoolInfo({ pool, isMobile = false }) {
  const t = useTranslations()
  const { balance: poolBalance, isLoading: loadingPoolBalance } = useWeightPoolData(pool ? pool.address : null)
  const { gaugeBalance, isLoading: loadingGaugeBalance } = useGaugeBalance(pool ? pool.gauge.address : zeroAddress)

  return (
    <div className='flex flex-col rounded-xl bg-neutral-800 '>
      <div className='flex flex-2 flex-col gap-2 px-4 pb-4 pt-2 lg:flex-1'>
        <PieChart tokens={pool?.tokens || []} bgColor='#1A121E' showTotalPercent={false} />
        <div
          className={cn(
            'mx-auto flex w-full gap-4',
            (pool?.tokens || []).length > 4 && 'grid grid-cols-4 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6',
          )}
        >
          {(pool?.tokens || []).map((item, idx) => (
            <div key={`${item?.data?.address}_${idx}`} className='flex flex-row items-center gap-[6px]'>
              <div className='h-3 w-3 rounded-full' style={{ backgroundColor: colors[idx] }} />
              <TextHeading>{item?.symbol}</TextHeading>
            </div>
          ))}
        </div>
      </div>
      <div
        className={cn(
          'flex-1 rounded-lg bg-neutral-900 p-4 lg:flex-2 xl:p-4',
          isMobile && 'border-none bg-transparent',
        )}
      >
        <div className='flex flex-col gap-4'>
          <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
          <div className='flex flex-col gap-3'>
            {(pool?.tokens || []).map(token => (
              <div key={token.address} className='flex items-center justify-between'>
                <Paragraph className='font-medium'>
                  {unwrappedSymbol(token)} {t('Amount')}
                </Paragraph>
                <Paragraph>{formatAmount(token.reserve)}</Paragraph>
              </div>
            ))}
          </div>
        </div>
        <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
          <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
              {loadingPoolBalance ? (
                <Skeleton className='h-11 w-20' />
              ) : (
                <Paragraph>{formatAmount(poolBalance)} LP</Paragraph>
              )}
            </div>
            <div className='flex items-center justify-between'>
              <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
              {loadingGaugeBalance ? (
                <Skeleton className='h-11 w-20' />
              ) : (
                <Paragraph>{formatAmount(gaugeBalance)} LP</Paragraph>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiquidityPoolInfo
