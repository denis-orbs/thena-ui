'use client'

import { gql } from 'graphql-request'
import { useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { ChainId } from 'thena-sdk-core'

import Skeleton from '@/components/skeleton'
import { fusionClient, v1Client } from '@/lib/graphql'
import { formatAmount } from '@/lib/utils'

import { Features } from './Features'
import { Heading } from '../Common/Heading'
import HomeImage from '../Common/HomeImage'

const FUSION_STATS = gql`
  query globalData {
    factories {
      totalValueLockedUSD
      totalVolumeUSD
      txCount
    }
  }
`

const V1_STATS = gql`
  query globalData {
    factories {
      totalLiquidityUSD
      totalVolumeUSD
      txCount
    }
  }
`

const fetchStats = async () => {
  const chainId = ChainId.BSC
  const [fusionData, v1Data] = await Promise.all([
    fusionClient[chainId].request(FUSION_STATS),
    v1Client[chainId].request(V1_STATS),
  ])
  return {
    tvl: Number(fusionData.factories[0].totalValueLockedUSD) + Number(v1Data.factories[0].totalLiquidityUSD),
    totalVolume: Number(fusionData.factories[0].totalVolumeUSD) + Number(v1Data.factories[0].totalVolumeUSD),
    txCount: Number(fusionData.factories[0].txCount) + Number(v1Data.factories[0].txCount),
  }
}

function Stats() {
  const { data: chartData } = useSWRImmutable('thena total stats', () => fetchStats())

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
      {
        value: chartData ? `${formatAmount(chartData.txCount, true)}` : null,
        description: 'Total Swaps Made',
        svg: '/images/home/stats/repeat.svg',
      },
    ],
    [chartData],
  )
  return (
    <>
      <HomeImage
        alt='wave'
        src='/images/home/stats/wave.png'
        className='absolute -mt-6 w-full backdrop-blur-[20px] lg:-mt-[180px]'
      />
      <div className='relative z-40 mx-auto max-w-[1152px] px-10 pt-[150px] xl:px-0 xl:pt-[422px]'>
        <Heading heading='THENA in Numbers' wrapperStyles='items-center' />
        <div className='flex flex-col justify-center space-y-10 pb-20 pt-12 lg:flex-row lg:items-center lg:space-x-[136px] lg:space-y-0 lg:py-14'>
          {statsData.map((item, idx) => (
            <div key={idx} className='flex items-start space-x-5'>
              <div className='relative flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-white border-opacity-10 bg-white bg-opacity-[0.04] p-1.5 lg:h-14 lg:w-14 lg:p-2'>
                <div className='shadow-box flex h-9 w-9 flex-col items-center justify-center rounded-lg bg-[#DF0ED5] lg:h-10 lg:w-10'>
                  <HomeImage className='w-fit' alt='icon' src={item.svg} />
                </div>
                <HomeImage
                  alt='layer blur'
                  src='/images/home/stats/layerblur.png'
                  className='absolute bottom-0 w-full blur-[8px]'
                />
              </div>
              <div className='flex flex-col gap-3'>
                <p className='text-base leading-4 tracking-[-0.64px] text-white/40'>{item.description}</p>
                {item.value ? (
                  <p className='font-archia text-xl font-semibold leading-[14px] tracking-[-0.8px] lg:text-4xl lg:leading-[25px] lg:tracking-[1.44px]'>
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
