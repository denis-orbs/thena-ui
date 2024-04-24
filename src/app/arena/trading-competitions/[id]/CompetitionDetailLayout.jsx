'use client'

import { gql } from 'graphql-request'
import { compact, isNil } from 'lodash'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { TextButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Tabs from '@/components/tabs'
import { Paragraph } from '@/components/typography'
import { SizeTypes } from '@/constant/type'
import { useCompetitionFormat } from '@/hooks/useCompetitionFormat'
import { useEventType } from '@/hooks/useEventType'
import { v4Client } from '@/lib/graphql'
import { EVENT_TYPES, objectToQuery } from '@/lib/tradingCompetition/utils'
import { sleep, sliceAddress } from '@/lib/utils'
import { ArrowLeftIcon, Verified } from '@/svgs'

import CompetitionCard from './CompetitionCard'
import Sidebar from './SideBar'

const V4_COMPETITION_DATA = gql`
  query V4_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      description
      id
      name
      entryFee
      timestamp {
        endTimestamp
        registrationEnd
        registrationStart
        startTimestamp
      }
      market
      prize {
        totalPrize
        token
        winType
        hostContribution
        ownerFee
        weights
      }
      owner {
        id
        isVerified
      }
      participants {
        id
        pnl
      }
      participantCount
      maxParticipants
      competitionRules {
        winningToken
        startingBalance
        tradingTokens
      }
      tradingCompetitionSpot
    }
  }
`

const fetchCompetition = async id => {
  try {
    const { tradingCompetitionById: competition } = await v4Client.request(V4_COMPETITION_DATA, { id })
    return competition
  } catch (error) {
    return { error: true }
  }
}

function CompetitionDetailLayout({ children, params }) {
  const {
    data: competition,
    isLoading,
    mutate,
  } = useSWR('competition detail api', () => fetchCompetition(params.id), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  const t = useTranslations()
  const { replace } = useRouter()

  const pathname = usePathname()

  const [selectedTab, setSelectedTab] = useState(
    ['leaderboard', 'participants', 'analytics'].includes(pathname.split('/').slice(-1)[0])
      ? pathname.split('/').slice(-1)[0]
      : 'details',
  )

  const { eventType } = useEventType(competition?.timestamp)

  const [queryParams, setQueryParams] = useState('')

  const _competition = useCompetitionFormat(competition)

  const subTabs = useMemo(
    () =>
      compact([
        {
          label: t('Details'),
          active: selectedTab === 'details',
          onClickHandler: () => {
            setSelectedTab('details')
            replace(`/arena/trading-competitions/${params.id}`)
          },
        },
        (eventType === EVENT_TYPES.LIVE || eventType === EVENT_TYPES.ENDED) && _competition?.participantCount !== 0
          ? {
              label: t('Leaderboard'),
              active: selectedTab === 'leaderboard',
              onClickHandler: () => {
                setSelectedTab('leaderboard')

                replace(`/arena/trading-competitions/${params.id}/leaderboard`)
              },
            }
          : undefined,
        _competition?.participantCount !== 0
          ? {
              label: t('Participants'),
              active: selectedTab === 'participants',
              onClickHandler: () => {
                setSelectedTab('participants')
                replace(`/arena/trading-competitions/${params.id}/participants`)
              },
            }
          : undefined,
        eventType !== EVENT_TYPES.UPCOMING
          ? {
              label: t('Analytics'),
              active: selectedTab === 'analytics',
              onClickHandler: () => {
                setSelectedTab('analytics')
                replace(`/arena/trading-competitions/${params.id}/analytics`)
              },
            }
          : undefined,
      ]),
    [_competition?.participantCount, eventType, params.id, replace, selectedTab, t],
  )

  const retryCompetition = useCallback(async () => {
    let retries = 0
    const maxRetries = 5

    while (retries < maxRetries) {
      if (!isNil(competition)) {
        break
      }

      await mutate()

      await sleep(3000)
      retries++
    }
  }, [competition, mutate])

  useEffect(() => {
    setQueryParams(
      objectToQuery({
        search: sessionStorage.getItem('search'),
        free: sessionStorage.getItem('free'),
        market: sessionStorage.getItem('market'),
        sortBy: sessionStorage.getItem('sortBy'),
      }),
    )
  }, [])

  useEffect(() => {
    retryCompetition()
  }, [retryCompetition])

  if (isLoading || !competition) {
    return <Loading />
  }

  if (pathname.endsWith('/trade')) {
    return (
      <main className='flex min-h-screen flex-col'>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </main>
    )
  }

  return (
    <main className='flex min-h-screen flex-col'>
      <Suspense fallback={<Loading />}>
        <div className='grid grid-cols-12 gap-4 lg:gap-12'>
          <div className='col-span-12 lg:col-span-7'>
            <div className='sticky top-[128px] z-20 flex min-h-11 items-center justify-between bg-[#120916] bg-opacity-20 px-1 pb-2 pt-4 backdrop-blur-2xl lg:top-[150px] lg:mb-4 lg:pt-10'>
              <Link href={`/arena${queryParams}`}>
                <TextButton className='pl-0' LeadingIcon={ArrowLeftIcon}>
                  {t('Back')}
                </TextButton>
              </Link>

              <Link
                className='flex cursor-pointer items-center justify-center gap-2'
                href={`/arena/profile/${competition.owner.id.toLowerCase()}`}
              >
                <CircleImage src={Avatar} alt='avatar' className='size-8' />
                <Paragraph>{sliceAddress(competition.owner.id)}</Paragraph>
                {competition.owner.isVerified && (
                  <div className='h-5 w-5'>
                    <Verified />
                  </div>
                )}
              </Link>
            </div>
            <CompetitionCard competition={_competition} eventType={eventType} />
            <div className='mt-10 flex w-full flex-col gap-4'>
              <Tabs
                data={subTabs}
                size={SizeTypes.Small}
                itemClassName='text-sm'
                className='justify-start overflow-x-auto'
              />
              {children}
            </div>
          </div>
          <Sidebar competition={_competition} eventType={eventType} />
        </div>
      </Suspense>
    </main>
  )
}

export default CompetitionDetailLayout
