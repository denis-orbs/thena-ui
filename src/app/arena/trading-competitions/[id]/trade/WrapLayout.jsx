'use client'

import { redirect } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import Box from '@/components/box'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { TextHeading } from '@/components/typography'
import { TradingCompetitionContextProvider } from '@/context/tradingCompetitionContext'
import { useTradeCompetitionData } from '@/hooks/trade/useTradeCompetitionData'
import { useEventType } from '@/hooks/useEventType'
import { useTCContractInfor, useTradeData } from '@/hooks/useTcSpotContract'
import useWallet from '@/hooks/useWallet'
import { errorToast } from '@/lib/notify'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { fromWei } from '@/lib/utils'
import { XIcon } from '@/svgs'

import { TCTradeSideBar } from './TCTradeSideBar'
import TopBar from './TopBar'
import { TradeNotStarted } from './TradeNotStarted'

export function WrapLayout({ children, params }) {
  const { account } = useWallet()
  const t = useTranslations()

  const [fromAddress, setFromAddress] = useState(null)
  const [toAddress, setToAddress] = useState(null)
  const [showBanner, setShowBanner] = useState(true)
  const [showIconCloseBanner, setShowIconCloseBanner] = useState(false)

  const { competition } = useTradeCompetitionData(params.id)
  const {
    userBalance,
    balance,
    reload: reloadBalanceData,
  } = useTradeData(competition?.tcAddress, competition?.competitionRules?.winningToken?.address)

  const { eventType } = useEventType(competition?.timestamp)

  const { isRegistered, loaded } = useTCContractInfor(competition?.tcAddress, undefined, undefined, competition?.market)

  const tradingTokens = useMemo(() => {
    const tokens = competition?.competitionRules?.tradingTokens || []
    if (!userBalance || !Array.isArray(userBalance) || userBalance.length !== 2) {
      return tokens
    }
    const userTokens = userBalance[1]
    const userBalances = userBalance[0]

    return tokens
      .map(token => {
        const find = userTokens.findIndex(item => item.toLowerCase() === token.address.toLowerCase())
        const value = find !== -1 ? fromWei(userBalances[find], token.decimals) : token.balance

        return {
          ...token,
          balance: value,
        }
      })
      .sort((a, b) => {
        if (a.balance.times(a.price).lt(b.balance.times(b.price))) return 1
        if (a.balance.times(a.price).gt(b.balance.times(b.price))) return -1
        return 0
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
      <TopBar competition={competition} balance={balance} />
      {showBanner && (
        <Box
          onMouseOver={() => setShowIconCloseBanner(true)}
          onMouseLeave={() => setShowIconCloseBanner(false)}
          className='border-primary-800 bg-primary-950 relative mb-10 flex flex-col space-y-2 border'
        >
          <TextHeading className='text-xl'>{t('Whenever You Make A Swap')}</TextHeading>
          <TextHeading className='text-base font-normal'>
            {t('If You Want To Know The Real PnL', { symbol: competition?.competitionRules?.winningToken?.symbol })}
          </TextHeading>
          {showIconCloseBanner && (
            <EmphasisIconButton
              className='absolute top-1 right-1 m-0! h-6 w-6 lg:h-6 lg:w-6'
              classNames='lg:h-4 lg:w-4'
              Icon={XIcon}
              onClick={() => setShowBanner(false)}
            />
          )}
        </Box>
      )}
      {eventType === EVENT_TYPES.LIVE ? (
        <TCTradeSideBar
          fromAsset={fromAsset}
          toAsset={toAsset}
          setFromAsset={setFromAsset}
          setToAsset={setToAsset}
          assets={tradingTokens}
          tcAddress={competition?.tcAddress}
          reloadBalanceData={reloadBalanceData}
        >
          {children}
        </TCTradeSideBar>
      ) : (
        <TradeNotStarted startTimestamp={competition?.timestamp?.startTimestamp}>
          <TCTradeSideBar
            fromAsset={fromAsset}
            toAsset={toAsset}
            setFromAsset={setFromAsset}
            setToAsset={setToAsset}
            assets={tradingTokens}
            tcAddress={competition?.tcAddress}
          >
            {children}
          </TCTradeSideBar>
        </TradeNotStarted>
      )}
      {/* <DepositModal competition={competition} isOpen={showModalDeposit} closeModal={() => setShowModalDeposit(false)} /> */}
    </TradingCompetitionContextProvider>
  )
}
