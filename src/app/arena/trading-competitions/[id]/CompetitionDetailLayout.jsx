'use client'

import { gql } from 'graphql-request'
import { compact } from 'lodash'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { Suspense, useMemo, useState } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import { TextButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Tabs from '@/components/tabs'
import { Paragraph } from '@/components/typography'
import { SizeTypes } from '@/constant/type'
import { useCompetitionFormat } from '@/hooks/useCompetitionFormat'
import { v4Client } from '@/lib/graphql'
import { EVENT_TYPES, getEventType } from '@/lib/tradingCompetition/utils'
import { ArrowLeftIcon } from '@/svgs'

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
  const { replace, back, push } = useRouter()

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
        (eventType === EVENT_TYPES.LIVE || eventType === EVENT_TYPES.ENDED) && competition?.participantCount !== 0
          ? {
              label: t('Leaderboard'),
              active: selectedTab === 'leaderboard',
              onClickHandler: () => {
                setSelectedTab('leaderboard')

                replace(`/arena/trading-competitions/${params.id}/leaderboard`)
              },
            }
          : undefined,
        competition?.participantCount !== 0
          ? {
              label: t('Participants'),
              active: selectedTab === 'participants',
              onClickHandler: () => {
                setSelectedTab('participants')
                replace(`/arena/trading-competitions/${params.id}/participants`)
              },
            }
          : undefined,
        {
          label: t('Analytics'),
          active: selectedTab === 'analytics',
          onClickHandler: () => {
            setSelectedTab('analytics')
            replace(`/arena/trading-competitions/${params.id}/analytics`)
          },
        },
      ]),
    [competition?.participantCount, eventType, params.id, replace, selectedTab, t],
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
            <div className='sticky top-[128px] z-20 flex min-h-11 items-center justify-between bg-[#120916] bg-opacity-20 px-1 pb-2 pt-4 backdrop-blur-2xl lg:top-[176px] lg:mb-4 lg:pt-10'>
              <TextButton className='pl-0' LeadingIcon={ArrowLeftIcon} onClick={() => back()}>
                {t('Back')}
              </TextButton>

              <div
                className='flex cursor-pointer items-center justify-center gap-2'
                onClick={() => push(`/arena/profile/${competition.owner.id}`)}
              >
                <CircleImage src={Avatar} alt='avatar' className='size-8' />
                <Paragraph>{`${competition.owner.id.slice(0, 6)}...${competition.owner.id.slice(-4)}`}</Paragraph>
              </div>
            </div>
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
