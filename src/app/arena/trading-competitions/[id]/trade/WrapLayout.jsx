'use client'

import { redirect } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import Box from '@/components/box'
import { TextHeading } from '@/components/typography'
import Contracts from '@/constant/contracts'
import { useTradeCompetitionData } from '@/hooks/trade/useTradeCompetitionData'
import { useEventType } from '@/hooks/useEventType'
import { useWrap } from '@/hooks/useSwap'
import { useTCContractInfor, useTradeData } from '@/hooks/useTcSpotContract'
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
  const t = useTranslations()

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

  const { isRegistered, loaded } = useTCContractInfor(competition?.tradingCompetitionSpot)

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
    if (loaded && competition) {
      if (!account || !isRegistered) {
        errorToast('You Must Be A Participant')
        redirect(`/arena/trading-competitions/${params.id}`)
      }
    }
  }, [account, competition, isRegistered, params.id, loaded])

  if (!competition || !loaded || !account || !isRegistered) {
    return <Loading />
  }

  return (
    <>
      <TopBar handleClickShowModal={() => setShowModalDeposit(true)} competition={competition} />
      <Box className='mb-10 flex flex-col space-y-2 border border-primary-800 bg-primary-950'>
        <TextHeading className='text-xl'>{t('Whenever You Make A Swap')}</TextHeading>
        <TextHeading className='text-base font-normal'>
          {t('If You Want To Know The Real PnL', { symbol: fromAsset?.symbol })}
        </TextHeading>
      </Box>
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
