'use client'

import { gql } from 'graphql-request'
import { compact } from 'lodash'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { Suspense, useMemo, useState } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import Tabs from '@/components/tabs'
import { SizeTypes } from '@/constant/type'
import { useCompetitionFormat } from '@/hooks/useCompetitionFormat'
import { v4Client } from '@/lib/graphql'
import { EVENT_TYPES, getEventType } from '@/lib/tradingCompetition/utils'

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
  const { data: competition } = useSWR('competition detail api', () => fetchCompetition(params.id), {
    refreshInterval: 60000,
  })
  const t = useTranslations()
  const { replace } = useRouter()

  const pathname = usePathname()

  const [selectedTab, setSelectedTab] = useState(
    ['leaderboard', 'participants', 'analytics'].includes(pathname.split('/').slice(-1)[0])
      ? pathname.split('/').slice(-1)[0]
      : 'details',
  )

  const eventType = useMemo(() => getEventType(competition?.timestamp), [competition?.timestamp])

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
        eventType === EVENT_TYPES.LIVE || eventType === EVENT_TYPES.ENDED
          ? {
              label: t('Leaderboard'),
              active: selectedTab === 'leaderboard',
              onClickHandler: () => {
                setSelectedTab('leaderboard')

                replace(`/arena/trading-competitions/${params.id}/leaderboard`)
              },
            }
          : undefined,
        {
          label: t('Participants'),
          active: selectedTab === 'participants',
          onClickHandler: () => {
            setSelectedTab('participants')
            replace(`/arena/trading-competitions/${params.id}/participants`)
          },
        },
        {
          label: t('Analytics'),
          active: selectedTab === 'analytics',
          onClickHandler: () => {
            setSelectedTab('analytics')
            replace(`/arena/trading-competitions/${params.id}/analytics`)
          },
        },
      ]),
    [eventType, params.id, replace, selectedTab, t],
  )

  const _competition = useCompetitionFormat(competition)

  if (!competition) {
    return <Loading />
  }

  return (
    <main className='flex min-h-screen flex-col'>
      <Suspense fallback={<Loading />}>
        <div className='grid grid-cols-12 gap-4 lg:gap-12'>
          <div className='col-span-12 lg:col-span-7'>
            <CompetitionCard competition={_competition} />
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
          <Sidebar competition={_competition} />
        </div>
      </Suspense>
    </main>
  )
}

export default CompetitionDetailLayout
