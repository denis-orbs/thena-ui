'use client'

import { gql } from 'graphql-request'
import { compact, isNil } from 'lodash'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Loading from '@/app/loading'
import Box from '@/components/box'
import { TextButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import Tabs from '@/components/tabs'
import { TextHeading } from '@/components/typography'
import { TC_MARKET_TYPES } from '@/constant'
import { SizeTypes } from '@/constant/type'
import { TradingCompetitionContextProvider } from '@/context/tradingCompetitionContext'
import { useUserInfo } from '@/context/userInfoContext'
import { useCompetitionFormat } from '@/hooks/useCompetitionFormat'
import { useEventType } from '@/hooks/useEventType'
import { v4Client } from '@/lib/graphql'
import { EVENT_TYPES, objectToQuery } from '@/lib/tradingCompetition/utils'
import { cn, sleep } from '@/lib/utils'
import { ArrowLeftIcon, XIcon } from '@/svgs'

import CompetitionCard from './CompetitionCard'
import Sidebar from './SideBar'
import { TCNotReadyYet } from './TCNotReadyYet'

const V4_COMPETITION_DATA = gql`
  query V4_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      description
      id
      name
      bannerUrl
      entryFeeUpdate
      timestamp {
        endTimestamp
        registrationEnd
        registrationStart
        startTimestamp
      }
      market
      prizeUpdate {
        ownerFee
        token
        totalPrize
        weights
        winType
      }
      owner {
        id
        isVerified
        avatar
        username
        nameColor
        checkMarkIcon
        verifiedAt
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
        pairIds
        minimumBalance
      }
      tcAddress
    }
  }
`
const V4_TC_TEMPORARY = gql`
  query V4_TC_TEMPORARY($tcId: String!) {
    tcTemporaries(where: { tcId_eq: $tcId }) {
      id
      tcId
    }
  }
`

const tcTemporary = async tcId => {
  try {
    const { tcTemporaries } = await v4Client.request(V4_TC_TEMPORARY, { tcId })

    return !!tcTemporaries?.length
  } catch (error) {
    return undefined
  }
}

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

  const { data: checkTCReady, isLoading: isLoadingCheckTCReady } = useSWR(
    ['competition check ready', params.id],
    () => tcTemporary(params.id),
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
    },
  )

  const { userInfo } = useUserInfo()

  const t = useTranslations()

  const pathname = usePathname()

  const { eventType } = useEventType(competition?.timestamp)

  const [queryParams, setQueryParams] = useState('')

  const _competition = useCompetitionFormat(competition)

  const subTabs = useMemo(
    () =>
      compact([
        {
          label: t('Details'),
          active: pathname === `/arena/trading-competitions/${params.id}`,
          href: `/arena/trading-competitions/${params.id}`,
          isLink: true,
        },
        (eventType === EVENT_TYPES.LIVE || eventType === EVENT_TYPES.ENDED) && _competition?.participantCount !== 0
          ? {
              label: t('Leaderboard'),
              active: pathname === `/arena/trading-competitions/${params.id}/leaderboard`,

              isLink: true,
              href: `/arena/trading-competitions/${params.id}/leaderboard`,
            }
          : undefined,
        _competition?.participantCount !== 0
          ? {
              label: t('Participants'),
              active: pathname === `/arena/trading-competitions/${params.id}/participants`,

              isLink: true,
              href: `/arena/trading-competitions/${params.id}/participants`,
            }
          : undefined,
        eventType !== EVENT_TYPES.UPCOMING
          ? {
              label: t('Analytics'),
              active: pathname === `/arena/trading-competitions/${params.id}/analytics`,

              isLink: true,
              href: `/arena/trading-competitions/${params.id}/analytics`,
            }
          : undefined,
      ]),
    [_competition?.participantCount, eventType, params.id, pathname, t],
  )

  const enableEditBanner = useMemo(
    () =>
      (userInfo?.id === competition?.owner?.id && competition?.owner?.isVerified) ||
      userInfo?.isAdmin ||
      userInfo?.isSuperAdmin,
    [userInfo?.isAdmin, userInfo?.isSuperAdmin, competition?.owner?.isVerified, competition?.owner?.id, userInfo?.id],
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

  const checkJoinTc = useMemo(
    () =>
      competition?.participants?.find(p => String(p.id).split('-')[2].toLowerCase() === userInfo?.id?.toLowerCase()),
    [competition?.participants, userInfo?.id],
  )

  const [showBanner, setShowBanner] = useState(false)
  const [showIconCloseBanner, setShowIconCloseBanner] = useState(false)

  useEffect(() => {
    if (competition?.market === TC_MARKET_TYPES.PERPETUAL && checkJoinTc) {
      setShowBanner(true)
    } else {
      setShowBanner(false)
    }
  }, [checkJoinTc, competition?.market])

  useEffect(() => {
    setQueryParams(
      objectToQuery({
        type: sessionStorage.getItem('type'),
        search: sessionStorage.getItem('search'),
        free: sessionStorage.getItem('free'),
        market: sessionStorage.getItem('market'),
        sortBy: sessionStorage.getItem('sortBy'),
        status: sessionStorage.getItem('status'),
      }),
    )
  }, [])

  useEffect(() => {
    retryCompetition()
  }, [retryCompetition])

  if (isLoading || isLoadingCheckTCReady || (!checkTCReady && (!competition || !_competition))) {
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
    <TradingCompetitionContextProvider>
      <main className={cn('flex flex-col', checkTCReady ? 'h-full' : 'min-h-screen')}>
        <Suspense fallback={<Loading />}>
          {checkTCReady ? (
            <TCNotReadyYet />
          ) : (
            <>
              {showBanner && (
                <Box
                  onMouseOver={() => setShowIconCloseBanner(true)}
                  onMouseLeave={() => setShowIconCloseBanner(false)}
                  className='relative mt-10 flex flex-col space-y-2 border border-primary-800 bg-primary-950'
                >
                  <TextHeading className='text-base font-normal'>{t('You MUST close all your positions')}</TextHeading>
                  {showIconCloseBanner && (
                    <EmphasisIconButton
                      className='absolute right-1 top-1 !m-0 h-6 w-6 lg:h-6 lg:w-6'
                      classNames='lg:h-4 lg:w-4'
                      Icon={XIcon}
                      onClick={() => setShowBanner(false)}
                    />
                  )}
                </Box>
              )}
              <div className='grid grid-cols-12 gap-4 lg:gap-12'>
                <div className='col-span-12 lg:col-span-7'>
                  <div className='sticky top-[128px] z-20 flex min-h-11 items-center justify-between bg-[#120916] bg-opacity-20 px-1 pb-2 pt-4 backdrop-blur-2xl lg:top-[150px] lg:mb-4 lg:pt-10'>
                    <Link href={`/arena${queryParams}`}>
                      <TextButton className='pl-0' LeadingIcon={ArrowLeftIcon}>
                        {t('Back')}
                      </TextButton>
                    </Link>
                    <UserProfileCard user={competition.owner} showVerified={competition.owner?.isVerified} />
                  </div>
                  <CompetitionCard
                    competition={_competition}
                    eventType={eventType}
                    enableEditBanner={enableEditBanner}
                  />
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
            </>
          )}
        </Suspense>
      </main>
    </TradingCompetitionContextProvider>
  )
}

export default CompetitionDetailLayout
