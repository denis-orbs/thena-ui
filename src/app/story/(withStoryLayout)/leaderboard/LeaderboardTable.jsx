'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useEffect, useMemo, useState } from 'react'

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

function ThenianElement({ data, windowSize }) {
  return (
    <div className='flex items-center'>
      <div className='mr-2 flex h-9 w-9 items-center justify-center rounded-[50%] bg-neutral-600 text-center md:mr-3'>
        <Image src={data?.avatarUrl ?? Avatar} className='rounded-[50%]' width={36} height={36} alt='Avatar' />
      </div>
      <div
        className={cn(
          'break-words text-[14px] lg:text-[16px]',
          windowSize.width > 600 ? 'max-md:max-w-[calc(100%/2)]' : '',
        )}
      >
        {windowSize.width > 600 ? data.id : sliceAddress(data.id)}
      </div>
    </div>
  )
}

function RankElement({ data }) {
  switch (data.rank) {
    case 0: {
      return <FirstPrizeIcon className='size-7' />
    }
    case 1: {
      return <SecondPrizeIcon className='size-7' />
    }
    case 2: {
      return <ThirdPrizeIcon className='size-7' />
    }

    default: {
      return data.rank === null ? <>-</> : <>{data.rank + 1}</>
    }
  }
}

export default function LeaderboardTable({ userInfo }) {
  const t = useTranslations()
  const windowSize = useWindowSize()

  const [sort, setSort] = useState(sortOptions[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [data, setData] = useState()
  const [rowDefault, setRowDefault] = useState()

  useEffect(() => {
    const fetData = async () => {
      const res = await fetchParticipants(100)

      setData(res)
    }
    if (userInfo) {
      fetData()
    }
  }, [userInfo, windowSize])

  useEffect(() => {
    if (userInfo) {
      setRowDefault({
        id: userInfo.id,
        rank: userInfo.rank + 1,
        thenian: <ThenianElement data={userInfo} windowSize={windowSize} />,
        totalPoints: userInfo.totalPoints,
      })
    }
  }, [userInfo, windowSize])

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
    const final = sortedData.map(item => ({
      id: item.id,
      rank: <RankElement data={item} />,
      thenian: <ThenianElement data={item} windowSize={windowSize} />,
      totalPoints: item.totalPoints,
    }))
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
        hightLightById={userInfo.id}
        bgHightLight='bg-neutral-800'
        loading={!data}
        pageSize={10}
        defaultHead={userInfo.rank > 9 && currentPage === 1 ? rowDefault : undefined}
      />
    </div>
  )
}
