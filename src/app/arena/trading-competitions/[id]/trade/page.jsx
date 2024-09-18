'use client'

import { useMemo, useState } from 'react'

import Tabs, { TabPanel } from '@/components/tabs'
import { SizeTypes } from '@/constant/type'
import { useTradingCompetitionLeaderBoard } from '@/hooks/trade/useTradingCompetitionLeaderboard'
import { useEventType } from '@/hooks/useEventType'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { LeaderBoard } from '@/modules/TradingCompetition/LeaderBoard'
import { TradeHistory } from '@/modules/TradingCompetition/TradeHistory'

function TradePage({ params }) {
  const [selectedTab, setSelectedTab] = useState('leaderboard')

  const { competition } = useTradingCompetitionLeaderBoard(params.id)

  const { eventType } = useEventType(competition?.timestamp)

  const subTabs = useMemo(
    () => [
      {
        label: 'Leaderboard',
        active: selectedTab === 'leaderboard',
        onClickHandler: () => {
          setSelectedTab('leaderboard')
        },
      },
      {
        label: 'Trade History',
        active: selectedTab === 'history',
        onClickHandler: () => {
          setSelectedTab('history')
        },
      },
    ],
    [selectedTab],
  )

  if (eventType === EVENT_TYPES.UPCOMING) {
    return null
  }

  return (
    <div className='mt-10 flex w-full flex-col gap-4'>
      <Tabs data={subTabs} size={SizeTypes.Small} itemClassName='text-sm' className='justify-start overflow-x-auto' />
      <TabPanel value='leaderboard' select={selectedTab}>
        <LeaderBoard competition={competition} />
      </TabPanel>
      <TabPanel value='history' select={selectedTab}>
        <TradeHistory />
      </TabPanel>
    </div>
  )
}

export default TradePage
