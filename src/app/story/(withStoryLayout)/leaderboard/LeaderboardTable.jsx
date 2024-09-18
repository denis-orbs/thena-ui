'use client'

import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useEffect, useMemo, useState } from 'react'

import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { fetchParticipants, fetchParticipantsByChapter } from '@/modules/Story'
import { FirstPrizeIcon, InfoCircleGradient, SecondPrizeIcon, ThirdPrizeIcon } from '@/svgs'

function PointHead() {
  const t = useTranslations()
  return (
    <div className='flex flex-row'>
      <span>{t('Points')}</span>
      <span>
        <InfoCircleGradient className='ml-1 size-4 text-neutral-400' data-tooltip-id='point-description' />
      </span>
      <CustomTooltip id='point-description'>
        <span className='text-sm font-normal leading-5'>{t('THE Story leaderboard point description')}</span>
      </CustomTooltip>
    </div>
  )
}
function IsEligible() {
  const t = useTranslations()
  return (
    <div className='flex flex-row'>
      <span>{t('Eligible For Raffle')}</span>
      <span>
        <InfoCircleGradient className='ml-1 size-4 text-neutral-400' data-tooltip-id='point-description' />
      </span>
    </div>
  )
}

const sortOptions1 = [
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

const sortOptions2 = [
  {
    disabled: true,
    label: 'Thenian',
    value: 'thenian',
    isDesc: true,
    justify: 'text-wrap min-w-[130px]',
    width: 'lg:w-[90%]',
  },
  {
    disabled: true,
    label: 'Completed Tasks',
    value: 'completedTask',
    isDesc: true,
    width: 'w-[5%]',
  },
  {
    disabled: true,
    label: <IsEligible />,
    value: 'isEligible',
    isDesc: true,
    width: 'w-[5%]',
  },
]

function ThenianElement({ data, username }) {
  return (
    <div className='flex items-center gap-2 md:gap-3'>
      <Image
        src={data?.avatarUrl ?? Avatar}
        className='!size-8 rounded-full md:!size-9'
        width={36}
        height={36}
        alt='Avatar'
      />
      <div className='break-all text-sm md:text-base'>{username}</div>
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

export default function LeaderboardTable({ userInfo, currentTabIndex }) {
  const t = useTranslations()

  const [sort, setSort] = useState(currentTabIndex === 1 ? sortOptions1[0] : sortOptions2[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowDefault, setRowDefault] = useState()

  const { data: participants, isLoading: loadingParticipants } = useQuery({
    queryKey: ['getParticipants', userInfo],
    queryFn: () => fetchParticipants(300),
    refetchInterval: 30000,
    enabled: Boolean(userInfo),
    gcTime: 0,
  })

  const { data: participantsByChapter, isLoading: loadingParticipantsByChapter } = useQuery({
    queryKey: ['getParticipantsByChapter', userInfo, currentTabIndex],
    queryFn: () => fetchParticipantsByChapter(300, currentTabIndex, userInfo.id.toLowerCase()),
    refetchInterval: 30000,
    enabled: Boolean(userInfo),
    gcTime: 0,
  })

  useEffect(() => {
    if (userInfo && currentTabIndex === 1) {
      setRowDefault({
        id: userInfo.id,
        rank: <RankElement data={userInfo} />,
        thenian: <ThenianElement data={userInfo} username={userInfo.id} />,
        totalPoints: userInfo.totalPoints,
      })
    }
    if (currentTabIndex > 1 && participantsByChapter?.participantDetails) {
      const userDefault = participantsByChapter?.participantDetails
      setRowDefault({
        id: userDefault?.participantId,
        completedTask: `${userDefault?.completedTask}/${participantsByChapter?.pagination?.totalTask}`,
        thenian: <ThenianElement data={userDefault} username={userDefault?.participantId} />,
        isEligible: userDefault?.isEligible ? (
          <span className='text-success-700'>Yes</span>
        ) : (
          <span className='text-error-700'>No</span>
        ),
      })
    }
  }, [
    currentTabIndex,
    participantsByChapter?.pagination?.totalTask,
    participantsByChapter?.participantDetails,
    userInfo,
  ])

  const renderData = useMemo(
    () =>
      currentTabIndex === 1
        ? participants?.map(item => ({
            id: item.id,
            rank: <RankElement data={item} />,
            thenian: <ThenianElement data={item} username={item.id} />,
            totalPoints: item.totalPoints,
          }))
        : participantsByChapter?.results?.map(item => ({
            id: item.participantId,
            completedTask: `${item?.completedTask}/${participantsByChapter?.pagination?.totalTask}`,
            thenian: <ThenianElement data={item} username={item.participantId} />,
            isEligible: item.isEligible ? (
              <span className='text-success-700'>Yes</span>
            ) : (
              <span className='text-error-700'>No</span>
            ),
          })),
    [currentTabIndex, participants, participantsByChapter?.pagination?.totalTask, participantsByChapter?.results],
  )

  const finalData = useMemo(() => {
    const result = currentTabIndex === 1 ? participants : participantsByChapter?.results
    return !result ? [] : renderData
  }, [currentTabIndex, participants, participantsByChapter?.results, renderData])

  const indexUser = useMemo(() => {
    let index = -1
    if (userInfo?.id) {
      const itemUserIndex = finalData.findIndex(item => item?.id?.toLowerCase() === userInfo?.id.toLowerCase())
      if (itemUserIndex !== -1) {
        index = itemUserIndex
      }
    }
    return index
  }, [finalData, userInfo])

  return (
    <div className='border-gradient-secondary rounded-xl p-[1px]'>
      <div className='mb-[60.15px] rounded-xl bg-neutral-900'>
        <p className='pl-6 pt-8 text-[20px] font-medium text-neutral-50'>{t('Leaderboard')}</p>
        <Table
          data={finalData}
          className='w-full bg-neutral-900'
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sortOptions={currentTabIndex === 1 ? sortOptions1 : sortOptions2}
          sort={sort}
          setSort={setSort}
          tableBasic
          hightLightById={userInfo.id}
          bgHightLight='bg-neutral-800'
          loading={loadingParticipants || loadingParticipantsByChapter}
          pageSize={10}
          defaultHead={(indexUser > 9 || indexUser === -1) && currentPage === 1 ? rowDefault : undefined}
        />
      </div>
    </div>
  )
}
