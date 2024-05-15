'use client'

import { redirect } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import Box from '@/components/box'
import { TextHeading } from '@/components/typography'
import { TradingCompetitionContextProvider } from '@/context/tradingCompetitionContext'
import { useTradeCompetitionData } from '@/hooks/trade/useTradeCompetitionData'
import { useEventType } from '@/hooks/useEventType'
import { useTCContractInfor, useTradeData } from '@/hooks/useTcSpotContract'
import { errorToast } from '@/lib/notify'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

// import DepositModal from './DepositModal'
import { SideBar } from './SideBar'
import TopBar from './TopBar'
import { TradeNotStarted } from './TradeNotStarted'

export function WrapLayout({ children, params }) {
  const { account } = useWallet()
  const t = useTranslations()

  const [fromAddress, setFromAddress] = useState(null)
  const [toAddress, setToAddress] = useState(null)
  const [reloadFetch, setReloadFetch] = useState(0)

  // const [showModalDeposit, setShowModalDeposit] = useState(false)

  const { competition } = useTradeCompetitionData(params.id)
  const { userBalance } = useTradeData(
    competition?.tradingCompetitionSpot,
    competition?.competitionRules?.winningToken?.address,
  )

  const { eventType } = useEventType(competition?.timestamp)

  const { isRegistered, loaded } = useTCContractInfor(competition?.tradingCompetitionSpot)

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

  const fromAsset = useMemo(
    () => tradingTokens.find(token => token.address.toLowerCase() === fromAddress?.toLowerCase()),
    [fromAddress, tradingTokens],
  )

  const toAsset = useMemo(
    () => tradingTokens.find(token => token.address.toLowerCase() === toAddress?.toLowerCase()),
    [toAddress, tradingTokens],
  )

  useEffect(() => {
    if (!tradingTokens?.length) return
    setFromAddress(tradingTokens[0]?.address ?? null)
    setToAddress(tradingTokens[1]?.address ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradingTokens?.[0]?.address, tradingTokens?.[1]?.address])

  const setFromAsset = useCallback(asset => {
    setFromAddress(asset?.address)
  }, [])

  const setToAsset = useCallback(asset => {
    setToAddress(asset?.address)
  }, [])

  useEffect(() => {
    if (loaded && competition) {
      if (!account || !isRegistered) {
        errorToast('You Must Be A Participant')
        redirect(`/arena/trading-competitions/${params.id}`)
      }
    }
  }, [account, competition, isRegistered, params.id, loaded])

  if (!competition || !loaded) {
    return <Loading />
  }

  return (
    <TradingCompetitionContextProvider>
      <TopBar
        // handleClickShowModal={() => setShowModalDeposit(true)}
        competition={competition}
        reloadFetch={reloadFetch}
        setReloadFetch={setReloadFetch}
      />
      <Box className='mb-10 flex flex-col space-y-2 border border-primary-800 bg-primary-950'>
        <TextHeading className='text-xl'>{t('Whenever You Make A Swap')}</TextHeading>
        <TextHeading className='text-base font-normal'>
          {t('If You Want To Know The Real PnL', { symbol: competition?.competitionRules?.winningToken?.symbol })}
        </TextHeading>
      </Box>
      {eventType === EVENT_TYPES.LIVE ? (
        <SideBar
          fromAsset={fromAsset}
          toAsset={toAsset}
          setFromAsset={setFromAsset}
          setToAsset={setToAsset}
          assets={tradingTokens}
          tcSpot={competition?.tradingCompetitionSpot}
          setReloadFetch={setReloadFetch}
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
            assets={tradingTokens}
            tcSpot={competition?.tradingCompetitionSpot}
          >
            {children}
          </SideBar>
        </TradeNotStarted>
      )}
      {/* <DepositModal competition={competition} isOpen={showModalDeposit} closeModal={() => setShowModalDeposit(false)} /> */}
    </TradingCompetitionContextProvider>
  )
}
