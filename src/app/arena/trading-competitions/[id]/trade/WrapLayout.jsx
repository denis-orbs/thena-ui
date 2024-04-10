'use client'

import { redirect } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import Contracts from '@/constant/contracts'
import { useTradeCompetitionData } from '@/hooks/trade/useTradeCompetitionData'
import { useEventType } from '@/hooks/useEventType'
import { useWrap } from '@/hooks/useSwap'
import { useTradeData } from '@/hooks/useTcSpotContract'
import { errorToast } from '@/lib/notify'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import DepositModal from './DepositModal'
import { SideBar } from './SideBar'
import TopBar from './TopBar'
import { TradeNotStarted } from './TradeNotStarted'

export function WrapLayout({ children, params }) {
  const { account } = useWallet()

  const [fromAsset, setFromAsset] = useState(null)
  const [toAsset, setToAsset] = useState(null)

  const { onWrap, onUnwrap, pending: wrapPending } = useWrap()
  const [showModalDeposit, setShowModalDeposit] = useState(false)

  const { competition } = useTradeCompetitionData(params.id)
  const { userBalance } = useTradeData(
    competition?.tradingCompetitionSpot,
    competition?.competitionRules?.winningToken?.address,
  )

  const { eventType } = useEventType(competition?.timestamp)

  const isRegistered = useMemo(
    () =>
      competition?.participants.find(
        participant => participant?.participant?.id.toLowerCase() === account?.toLowerCase(),
      ),
    [account, competition],
  )

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

  const tradingTokens = useMemo(() => {
    const tokens = competition?.competitionRules?.tradingTokens || []
    if (!userBalance || !Array.isArray(userBalance) || userBalance.length !== 2) {
      return tokens
    }
    const userTokens = userBalance[1]
    const userBalances = userBalance[0]

    return tokens.map(token => {
      const find = userTokens.findIndex(item => item.toLowerCase() === token.address.toLowerCase())
      const value = find !== -1 ? fromWei(userBalances[find], token.decimals) : token.balance

      return {
        ...token,
        balance: value,
      }
    })
  }, [competition?.competitionRules?.tradingTokens, userBalance])

  useEffect(() => {
    if (!tradingTokens.length) return
    if (!fromAsset) {
      setFromAsset(tradingTokens[0] ?? null)
    }
    if (!toAsset) {
      setToAsset(tradingTokens[1] ?? null)
    }
  }, [fromAsset, toAsset, tradingTokens])

  useEffect(() => {
    if (competition) {
      if (!account || !isRegistered) {
        errorToast('You Must Be A Participant')
        redirect(`/arena/trading-competitions/${params.id}`)
      }
    }
  }, [account, isRegistered, params.id, competition])

  if (!competition || !account || !isRegistered) {
    return <Loading />
  }

  return (
    <>
      <TopBar handleClickShowModal={() => setShowModalDeposit(true)} competition={competition} />
      {eventType === EVENT_TYPES.LIVE ? (
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
          assets={tradingTokens}
        >
          {children}
        </SideBar>
      ) : (
        <TradeNotStarted startTimestamp={competition?.timestamp?.startTimestamp}>
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
            assets={tradingTokens}
          >
            {children}
          </SideBar>
        </TradeNotStarted>
      )}
      <DepositModal competition={competition} isOpen={showModalDeposit} closeModal={() => setShowModalDeposit(false)} />
    </>
  )
}
