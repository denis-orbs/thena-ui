'use client'

import { compact } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Tabs from '@/components/tabs'
import { SizeTypes } from '@/constant/type'
import { EVENT_TYPES, getEventType } from '@/lib/tradingCompetition/utils'

import { DetailTab } from './DetailTab'
import { LeaderboardTab } from './LeaderboardTab'

function DetailCompetition({ competition }) {
  const t = useTranslations()

  const [selectedTab, setSelectedTab] = useState('Details')

  const eventType = useMemo(() => getEventType(competition.timestamp), [competition.timestamp])

  const subTabs = useMemo(
    () =>
      compact([
        {
          label: t('Details'),
          active: selectedTab === 'Details',
          onClickHandler: () => {
            setSelectedTab('Details')
          },
        },
        eventType === EVENT_TYPES.LIVE || eventType === EVENT_TYPES.ENDED
          ? {
              label: t('Leaderboard'),
              active: selectedTab === 'Leaderboard',
              onClickHandler: () => {
                setSelectedTab('Leaderboard')
              },
            }
          : undefined,
        {
          label: t('Participants'),
          active: selectedTab === 'Participants',
          onClickHandler: () => {
            setSelectedTab('Participants')
          },
        },
        {
          label: t('Analytics'),
          active: selectedTab === 'Analytics',
          onClickHandler: () => {
            setSelectedTab('Analytics')
          },
        },
      ]),
    [eventType, selectedTab, t],
  )

  return (
    <div className='mt-10 flex w-full flex-col gap-4'>
      <Tabs data={subTabs} size={SizeTypes.Small} itemClassName='text-sm' className='justify-start overflow-x-auto' />
      <DetailTab competition={competition} selectedTab={selectedTab} />
      <LeaderboardTab competition={competition} selectedTab={selectedTab} />
    </div>
  )
}

export default DetailCompetition
