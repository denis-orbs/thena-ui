'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import Tabs, { TabPanel } from '@/components/tabs'
import { SizeTypes } from '@/constant/type'
import { useTradingCompetitionLeaderBoard } from '@/hooks/trade/useTradingCompetitionLeaderboard'
import { LeaderBoard } from '@/modules/TradingCompetition/LeaderBoard'
import { TradeHistory } from '@/modules/TradingCompetition/TradeHistory'

function TradePage({ params }) {
  const t = useTranslations()

  const [selectedTab, setSelectedTab] = useState('leaderboard')

  const { competition: competitionLeaderBoard } = useTradingCompetitionLeaderBoard(params.id)

  const subTabs = useMemo(
    () => [
      {
        label: t('Leaderboard'),
        active: selectedTab === 'leaderboard',
        onClickHandler: () => {
          setSelectedTab('leaderboard')
        },
      },
      {
        label: t('Trade History'),
        active: selectedTab === 'history',
        onClickHandler: () => {
          setSelectedTab('history')
        },
      },
    ],
    [selectedTab, t],
  )

  return (
    <div className='mt-10 flex w-full flex-col gap-4'>
      <Tabs data={subTabs} size={SizeTypes.Small} itemClassName='text-sm' className='justify-start overflow-x-auto' />
      <TabPanel value='leaderboard' select={selectedTab}>
        <LeaderBoard competition={competitionLeaderBoard} />
      </TabPanel>
      <TabPanel value='history' select={selectedTab}>
        <TradeHistory />
      </TabPanel>
    </div>
  )
}

export default TradePage
