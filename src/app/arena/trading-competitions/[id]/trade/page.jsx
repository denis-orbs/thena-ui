'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

import Tabs, { TabPanel } from '@/components/tabs'
import Contracts from '@/constant/contracts'
import { SizeTypes } from '@/constant/type'
import { useWrap } from '@/hooks/useSwap'
import { useTCContractInfor } from '@/hooks/useTcSpotContract'
import { useTradeCompetitionData } from '@/hooks/useTradeCompetitionData'
import { useTradingCompetitionLeaderBoard } from '@/hooks/useTradingCompetitionLeaderboard'
import { errorToast } from '@/lib/notify'
import useWallet from '@/lib/wallets/useWallet'
import { LeaderBoard } from '@/modules/TradingCompetition/LeaderBoard'
import { TradeHistory } from '@/modules/TradingCompetition/TradeHistory'

import DepositModal from './DepositModal'
import { SideBar } from './SideBar'
import TopBar from './TopBar'

function TradePage({ params }) {
  const t = useTranslations()
  const { account } = useWallet()

  const [fromAsset, setFromAsset] = useState(null)
  const [toAsset, setToAsset] = useState(null)
  const { onWrap, onUnwrap, pending: wrapPending } = useWrap()
  const [selectedTab, setSelectedTab] = useState('leaderboard')
  const [showModalDeposit, setShowModalDeposit] = useState(false)

  const { competition: competitionLeaderBoard } = useTradingCompetitionLeaderBoard(params.id)

  const { competition: detailCompetition } = useTradeCompetitionData(params.id)

  const { isRegistered } = useTCContractInfor(detailCompetition?.tradingCompetitionSpot)

  const tradingTokens = useMemo(
    () => detailCompetition?.competitionRules?.tradingTokens || [],
    [detailCompetition?.competitionRules?.tradingTokens],
  )

  useEffect(() => {
    if (!tradingTokens.length) return
    if (!fromAsset) {
      setFromAsset(tradingTokens[0] ?? null)
    }
    if (!toAsset) {
      setToAsset(tradingTokens[1] ?? null)
    }
  }, [fromAsset, toAsset, tradingTokens])

  const isWrap = useMemo(() => {
    if (
      fromAsset &&
      toAsset &&
      fromAsset.address === 'BNB' &&
      toAsset.address.toLowerCase() === Contracts.WBNB[fromAsset.chainId].toLowerCase()
    ) {
      return true
    }
    return false
  }, [fromAsset, toAsset])

  const isUnwrap = useMemo(() => {
    if (
      fromAsset &&
      toAsset &&
      toAsset.address === 'BNB' &&
      fromAsset.address.toLowerCase() === Contracts.WBNB[fromAsset.chainId].toLowerCase()
    ) {
      return true
    }
    return false
  }, [fromAsset, toAsset])

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

  useLayoutEffect(() => {
    if (!account || !isRegistered) {
      errorToast('You Must Be A Participant')
      // TODO: Need to fix
      // return redirect(`/arena/trading-competitions/${params.id}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!account || !isRegistered) {
    return null
  }

  console.log({
    fromAsset,
    toAsset,
  })

  return (
    <div>
      <TopBar handleClickShowModal={() => setShowModalDeposit(true)} competition={detailCompetition} />

      <SideBar
        fromAsset={fromAsset}
        toAsset={toAsset}
        setFromAsset={setFromAsset}
        setToAsset={setToAsset}
        isWrap={isWrap}
        isUnwrap={isUnwrap}
        onWrap={onWrap}
        onUnwrap={onUnwrap}
        wrapPending={wrapPending}
        assets={detailCompetition?.competitionRules?.tradingTokens || []}
      >
        <div className='mt-10 flex w-full flex-col gap-4'>
          <Tabs
            data={subTabs}
            size={SizeTypes.Small}
            itemClassName='text-sm'
            className='justify-start overflow-x-auto'
          />
          <TabPanel value='leaderboard' select={selectedTab}>
            <LeaderBoard competition={competitionLeaderBoard} />
          </TabPanel>
          <TabPanel value='history' select={selectedTab}>
            <TradeHistory />
          </TabPanel>
        </div>
      </SideBar>
      <DepositModal
        competition={detailCompetition}
        isOpen={showModalDeposit}
        closeModal={() => setShowModalDeposit(false)}
      />
    </div>
  )
}

export default TradePage
