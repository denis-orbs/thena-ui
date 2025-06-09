'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import useSWR from 'swr'

import Skeleton from '@/components/skeleton'
import { fetchStats } from '@/lib/subgraph'
import { formatAmount } from '@/lib/utils'

import { Features } from './Features'
import { Heading } from '../Common/Heading'
import HomeImage from '../Common/HomeImage'

function Stats() {
  const { data: chartData } = useSWR('thena total stats', () => fetchStats())
  const t = useTranslations()

  const statsData = useMemo(
    () => [
      {
        value: chartData ? `$${formatAmount(chartData.totalVolume, true)}` : null,
        description: 'Total Volume',
        svg: '/images/home/stats/stat1.svg',
      },
      {
        value: chartData ? `$${formatAmount(chartData.tvl, true)}` : null,
        description: 'Total Value Locked',
        svg: '/images/home/stats/dollar.svg',
      },
      // {
      //   value: chartData ? `${formatAmount(chartData.txCount, true)}` : null,
      //   description: 'Total Swaps Made',
      //   svg: '/images/home/stats/repeat.svg',
      // },
      {
        value: chartData ? `$${formatAmount(chartData.revenueData, true)}` : null,
        description: 'Total Revenue',
        svg: '/images/home/stats/dollar.svg',
      },
    ],
    [chartData],
  )
  return (
    <>
      <HomeImage
        alt='wave'
        src='/images/home/stats/wave.webp'
        className='absolute -mt-6 w-full backdrop-blur-[20px] lg:-mt-[180px]'
      />
      <div className='relative z-40 mx-auto max-w-[1152px] px-10 pt-[150px] xl:px-0 xl:pt-[260px]'>
        <Heading heading={t('THENA in Numbers')} wrapperStyles='items-center' />
        <div className='flex flex-col justify-center gap-10 pt-12 pb-20 lg:flex-row lg:items-center lg:gap-34 lg:py-14'>
          {statsData.map((item, idx) => (
            <div key={idx} className='flex items-start gap-5'>
              <div className='relative flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-1.5 lg:h-14 lg:w-14 lg:p-2'>
                <div className='shadow-box flex h-9 w-9 flex-col items-center justify-center rounded-lg bg-[#DF0ED5] lg:h-10 lg:w-10'>
                  <HomeImage className='w-fit' alt='icon' src={item.svg} />
                </div>
                <HomeImage
                  alt='layer blur-sm'
                  src='/images/home/stats/layerblur.png'
                  className='absolute bottom-0 w-full blur-xs'
                />
              </div>
              <div className='flex flex-col gap-3'>
                <p className='text-base leading-4 tracking-[-0.64px] text-white/40'>{t(item.description)}</p>
                {item.value ? (
                  <p className='font-archia text-xl leading-[14px] font-semibold tracking-[-0.8px] lg:text-4xl lg:leading-[25px] lg:tracking-[1.44px]'>
                    {item.value}
                  </p>
                ) : (
                  <Skeleton className='h-[25px] w-[100px]' />
                )}
              </div>
            </div>
          ))}
        </div>
        <Features />
      </div>
    </>
  )
}

export default Stats
