'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import Loading from '@/app/loading'
import Tabs, { TabPanel } from '@/components/tabs'
import { SizeTypes } from '@/constant/type'
import {
  useTradingCompetitionByAccount,
  useTradingCompetitionLeaderBoard,
} from '@/hooks/trade/useTradingCompetitionLeaderboard'
import { useEventType } from '@/hooks/useEventType'
import useWallet from '@/hooks/useWallet'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { LeaderBoard } from '@/modules/TradingCompetition/LeaderBoard'
import { TradeHistory } from '@/modules/TradingCompetition/TradeHistory'

function TradePage({ params }) {
  const { id } = useParams()
  const { account } = useWallet()
  const [sort, setSort] = useState({
    label: <span>#</span>,
    value: 'rank',
    width: 'w-[10%]',
    isDesc: false,
    disabled: true,
  })

  const [selectedTab, setSelectedTab] = useState('leaderboard')

  const [searchText, setSearchText] = useState('')

  const { competition, isLoading } = useTradingCompetitionLeaderBoard(params.id, searchText?.toLowerCase(), sort)
  const { competitionAccount, isLoading: isLoadingAccount } = useTradingCompetitionByAccount(id, account?.toLowerCase())

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
        {isLoadingAccount || isLoading ? (
          <Loading />
        ) : (
          <LeaderBoard
            competition={competition}
            setSearchText={setSearchText}
            searchText={searchText}
            competitionAccount={competitionAccount}
            sort={sort}
            setSort={setSort}
          />
        )}
      </TabPanel>
      <TabPanel value='history' select={selectedTab}>
        <TradeHistory />
      </TabPanel>
    </div>
  )
}

export default TradePage
