'use client'

import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useEffect, useMemo, useState } from 'react'

import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { fetchParticipants, fetchParticipantsByChapter } from '@/modules/Story'
import { FirstPrizeIcon, InfoIcon, SecondPrizeIcon, ThirdPrizeIcon } from '@/svgs'

function PointHead() {
  const t = useTranslations()
  return (
    <div className='flex flex-row items-center'>
      <span>{t('Points')}</span>
      <InfoIcon className='ml-1 size-4 stroke-neutral-400' data-tooltip-id='point-description' />
      <CustomTooltip id='point-description'>
        <span className='text-sm font-normal leading-5'>{t('THE Story leaderboard point description')}</span>
      </CustomTooltip>
    </div>
  )
}

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

export default function LeaderboardTable({ userInfo, currentTabIndex, rewardTimestamp }) {
  const t = useTranslations()

  const currentDate = new Date()
  const rewardTime = new Date(rewardTimestamp ?? new Date())

  const isWinners = currentDate > rewardTime

  const sortOptions = useMemo(
    () => [
      {
        disabled: true,
        label: currentTabIndex === 1 ? '#' : 'Thenian',
        value: currentTabIndex === 1 ? 'rank' : 'thenian',
        isDesc: currentTabIndex !== 1,
        justify: currentTabIndex === 1 ? 'text-center' : 'text-wrap min-w-[130px]',
        width: currentTabIndex === 1 ? 'w-[5%]' : 'w-[60%]',
      },
      {
        disabled: true,
        label: currentTabIndex === 1 ? 'Thenian' : 'Completed Tasks',
        value: currentTabIndex === 1 ? 'thenian' : 'completedTask',
        isDesc: true,
        justify: currentTabIndex === 1 ? 'text-wrap' : '',
        width: currentTabIndex === 1 ? 'lg:w-[80%]' : 'lg:w-[20%]',
      },
      {
        disabled: true,
        label: currentTabIndex === 1 ? <PointHead /> : isWinners ? 'Reward' : 'Eligible For Raffle',
        value: currentTabIndex === 1 ? 'totalPoints' : isWinners ? 'reward' : 'isEligible',
        isDesc: true,
        width: currentTabIndex === 1 ? 'w-[15%]' : 'w-[20%]',
      },
    ],
    [currentTabIndex, isWinners],
  )

  const [sort, setSort] = useState(sortOptions[0])
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
    queryFn: () =>
      fetchParticipantsByChapter(
        10000,
        currentTabIndex,
        userInfo.id.toLowerCase(),
        isWinners ? 'WINNERS' : 'LEADERBOARD',
      ),
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

    if (currentTabIndex > 1) {
      if (participantsByChapter?.participantDetails) {
        const userDefault = participantsByChapter?.participantDetails
        setRowDefault({
          id: userDefault?.participantId,
          completedTask: `${userDefault?.completedTask} / ${participantsByChapter?.pagination?.totalTask}`,
          thenian: <ThenianElement data={userDefault} username={userDefault?.username ?? userDefault?.participantId} />,
          isEligible:
            userDefault?.completedTask >= participantsByChapter?.pagination?.totalTask ? (
              <span className='text-success-700'>Yes</span>
            ) : (
              <span className='text-error-700'>No</span>
            ),
          reward: userDefault?.reward ? (
            <span className='text-success-700'>{userDefault?.reward}</span>
          ) : (
            <span className='text-error-700'>No</span>
          ),
        })
      } else {
        setRowDefault(undefined)
      }
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
            thenian: <ThenianElement data={item} username={item.username ?? item.id} />,
            totalPoints: item.totalPoints,
          }))
        : participantsByChapter?.results?.map(item => ({
            id: item.participantId,
            // eslint-disable-next-line max-len
            completedTask: `${participantsByChapter?.pagination?.totalTask} / ${participantsByChapter?.pagination?.totalTask}`,
            thenian: <ThenianElement data={item} username={item.username ?? item.participantId} />,
            isEligible: <span className='text-success-700'>Yes</span>,
            reward: <span className='text-success-700'>{item.reward}</span>,
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
      <div className='mb-9 rounded-xl bg-neutral-900'>
        <p className='pl-6 pt-8 text-[20px] font-medium text-neutral-50'>
          {currentTabIndex === 1 || !isWinners ? t('Leaderboard') : t('Winners List')}
        </p>
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
          loading={loadingParticipants || loadingParticipantsByChapter}
          pageSize={10}
          defaultHead={(indexUser > 9 || indexUser === -1) && currentPage === 1 ? rowDefault : undefined}
        />
      </div>
    </div>
  )
}
