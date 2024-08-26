'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo, useState } from 'react'

import Table from '@/components/table'
import { useWindowSize } from '@/hooks/useWindowSize'
import { cn, sliceAddress } from '@/lib/utils'
import { fetchParticipants } from '@/modules/Story'
import { FirstPrizeIcon, InfoCircleGradient, SecondPrizeIcon, ThirdPrizeIcon } from '@/svgs'

const sortOptions = [
  {
    label: '#',
    value: 'rank',
    isDesc: false,
    justify: 'text-center',
    width: 'w-[5%]',
  },
  {
    label: 'Thenian',
    value: 'thenian',
    isDesc: true,
    justify: 'text-wrap',
    width: 'lg:w-[80%]',
  },
  {
    label: (
      <div className='flex flex-row'>
        <span>Point</span>
        <span>
          <InfoCircleGradient className='ml-1 h-4 w-4 text-neutral-400' />
        </span>
      </div>
    ),
    value: 'totalPoints',
    isDesc: true,
    width: 'w-[10%]',
  },
]

export default function LeaderboardTable({ userInfo }) {
  const t = useTranslations()
  const windowSize = useWindowSize()

  const [sort, setSort] = useState(sortOptions[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [data, setData] = useState()

  const [hightLightIndex, setHightLightIndex] = useState()

  useMemo(async () => {
    if (userInfo) {
      const res = await fetchParticipants(100)

      setData(res)
    }
  }, [userInfo])

  useMemo(() => {
    if (userInfo) {
      if (currentPage === 1) {
        if (userInfo.rank > 10) {
          setHightLightIndex(0)
        } else {
          setHightLightIndex(userInfo.rank)
        }
      } else {
        setHightLightIndex(userInfo.rank)
      }
    }
  }, [currentPage, userInfo])

  const sortedData = useMemo(
    () =>
      !data
        ? []
        : data.sort((a, b) => {
            let res
            switch (sort.value) {
              case 'rank':
                res = (a.rank - b.rank) * (sort.isDesc ? -1 : 1)
                break
              case 'thenian':
                res = a.id.localeCompare(b.id) * (sort.isDesc ? -1 : 1)
                break
              case 'totalPoints':
                res = (a.totalPoints - b.totalPoints) * (sort.isDesc ? -1 : 1)
                break
              default:
                break
            }
            return res
          }),
    [data, sort],
  )

  const finalData = useMemo(() => {
    let final = sortedData

    if (userInfo && userInfo.rank > 10) {
      final = final.filter(item => item.id !== userInfo.id)
      final.unshift(userInfo)
    }

    final = final.map(item => {
      const thenian = (
        <div className='flex items-center'>
          <div className='mr-2 flex h-9 w-9 items-center justify-center rounded-[50%] bg-neutral-600 text-center md:mr-3'>
            <Image src={item?.avatarUrl ?? Avatar} className='rounded-[50%]' width={36} height={36} alt='Avatar' />
          </div>
          <div
            className={cn(
              'break-words text-[14px] lg:text-[16px]',
              windowSize.width > 600 ? 'max-md:max-w-[calc(100%/2)]' : '',
            )}
          >
            {windowSize.width > 600 ? item.id : sliceAddress(item.id)}
          </div>
        </div>
      )

      if (item.rank === 0) {
        console.log('0 item', item.rank)
        return {
          rank: <FirstPrizeIcon className='size-7' />,
          thenian,
          totalPoints: item.totalPoints,
        }
      }
      if (item.rank === 1) {
        return {
          rank: <SecondPrizeIcon className='size-7' />,
          thenian,
          totalPoints: item.totalPoints,
        }
      }
      if (item.rank === 2) {
        return {
          rank: <ThirdPrizeIcon className='size-7' />,
          thenian,
          totalPoints: item.totalPoints,
        }
      }

      if (item.rank === null) {
        item.rank = '-'
      }

      return {
        rank: item.rank + 1,
        thenian,
        totalPoints: item.totalPoints,
      }
    })
    return final
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sortedData), windowSize])

  return (
    <div className='mb-[60.15px] rounded-xl bg-neutral-900'>
      <p className='pl-6 pt-8 text-[20px] font-medium text-neutral-50'>{t('Leaderboard')}</p>
      <Table
        data={finalData}
        className='w-full bg-neutral-900'
        sortOptions={sortOptions}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sort={sort}
        setSort={setSort}
        tableBasic
        hightLightIndex={hightLightIndex}
        bgHightLight='bg-neutral-800'
        loading={!data}
        pageSize={10}
      />
    </div>
  )
}
