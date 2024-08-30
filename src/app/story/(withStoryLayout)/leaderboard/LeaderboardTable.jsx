'use client'

import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useEffect, useMemo, useState } from 'react'

import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { fetchParticipants } from '@/modules/Story'
import { FirstPrizeIcon, InfoCircleGradient, SecondPrizeIcon, ThirdPrizeIcon } from '@/svgs'

function PointHead() {
  const t = useTranslations()
  return (
    <div className='flex flex-row'>
      <span>{t('Point')}</span>
      <span>
        <InfoCircleGradient className='ml-1 size-4 text-neutral-400' data-tooltip-id='point-description' />
      </span>
      <CustomTooltip id='point-description'>
        <span className='text-sm font-normal leading-5'>{t('THE Story leaderboard point description')}</span>
      </CustomTooltip>
    </div>
  )
}

const sortOptions = [
  {
    disabled: true,
    label: '#',
    value: 'rank',
    isDesc: false,
    justify: 'text-center',
    width: 'w-[5%]',
  },
  {
    disabled: true,
    label: 'Thenian',
    value: 'thenian',
    isDesc: true,
    justify: 'text-wrap',
    width: 'lg:w-[80%]',
  },
  {
    disabled: true,
    label: <PointHead />,
    value: 'totalPoints',
    isDesc: true,
    width: 'w-[15%]',
  },
]

function ThenianElement({ data }) {
  return (
    <div className='flex items-center gap-2 md:gap-3'>
      <Image
        src={data?.avatarUrl ?? Avatar}
        className='!size-8 rounded-full md:!size-9'
        width={36}
        height={36}
        alt='Avatar'
      />
      <div className='break-all text-sm md:text-base'>{data.id}</div>
    </div>
  )
}

function RankElement({ data }) {
  switch (data.rank) {
    case 0: {
      return <FirstPrizeIcon className='size-7 md:size-9' />
    }
    case 1: {
      return <SecondPrizeIcon className='size-7 md:size-9' />
    }
    case 2: {
      return <ThirdPrizeIcon className='size-7 md:size-9' />
    }

    default: {
      return <p className='w-full text-center'>{data.rank === null ? '-' : data.rank + 1}</p>
    }
  }
}

export default function LeaderboardTable({ userInfo }) {
  const t = useTranslations()

  const [sort, setSort] = useState(sortOptions[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowDefault, setRowDefault] = useState()

  const { data } = useQuery({
    queryKey: ['getParticipants', userInfo],
    queryFn: () => fetchParticipants(300),
    refetchInterval: 30000,
    enabled: Boolean(userInfo),
    gcTime: 0,
  })

  useEffect(() => {
    if (userInfo) {
      setRowDefault({
        id: userInfo.id,
        rank: <RankElement data={userInfo} />,
        thenian: <ThenianElement data={userInfo} />,
        totalPoints: userInfo.totalPoints,
      })
    }
  }, [userInfo])

  const finalData = useMemo(
    () =>
      !data
        ? []
        : data.map(item => ({
            id: item.id,
            rank: <RankElement data={item} />,
            thenian: <ThenianElement data={item} />,
            totalPoints: item.totalPoints,
          })),
    [data],
  )

  return (
    <div className='mb-[60.15px] rounded-xl bg-neutral-900'>
      <p className='pl-6 pt-8 text-[20px] font-medium text-neutral-50'>{t('Leaderboard')}</p>
      <Table
        data={finalData}
        className='w-full bg-neutral-900'
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sortOptions={sortOptions}
        sort={sort}
        setSort={setSort}
        tableBasic
        hightLightById={userInfo.id}
        bgHightLight='bg-neutral-800'
        loading={!data}
        pageSize={10}
        defaultHead={(userInfo.rank > 9 || userInfo.rank === null) && currentPage === 1 ? rowDefault : undefined}
      />
    </div>
  )
}
