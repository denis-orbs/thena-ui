/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import { useMemo } from 'react'
import { useSpot } from '@orbs-network/spot-react'

import TokenInput from '@/components/input/TokenInput'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Tabs from '@/components/tabs'
import SwitchVerticalIcon from '~/svgs/switch-vertical.svg'

import { useTwapContext } from '../context'
import { formatDecimals } from '../utils'

export function TokenPanel({ isSrcToken }) {
  const { value: dstAmount, isLoading } = useSpot().dstTokenPanel
  const { toAsset, fromAsset, setToAddress, setFromAddress, setFromAmount, fromAmount } = useTwapContext()

  return (
    <TokenInput
      asset={isSrcToken ? fromAsset : toAsset}
      setAsset={asset => (isSrcToken ? setFromAddress(asset.address) : setToAddress(asset.address))}
      setOtherAsset={asset => (isSrcToken ? setToAddress(asset.address) : setFromAddress(asset.address))}
      otherAsset={isSrcToken ? toAsset : fromAsset}
      amount={isSrcToken ? fromAmount : dstAmount ? formatDecimals(dstAmount, 6) : ''}
      readOnly={!isSrcToken}
      setAmount={it => {
        setFromAmount(typeof it === 'string' ? it : it?.toString?.() || '')
      }}
      autoFocus={isSrcToken}
      disabled={!isSrcToken || (!isSrcToken && isLoading)}
      showExtendedTokens
    />
  )
}

export function PercentTabs() {
  const { fromAsset, setFromAmount } = useTwapContext()

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => setFromAmount(fromAsset?.balance?.times(0.1).toString(10) || '0'),
      },
      {
        label: '25%',
        onClickHandler: () => setFromAmount(fromAsset?.balance?.times(0.25).toString(10) || '0'),
      },
      {
        label: '50%',
        onClickHandler: () => setFromAmount(fromAsset?.balance?.times(0.5).toString(10) || '0'),
      },
      {
        label: 'Max',
        onClickHandler: () => setFromAmount(fromAsset?.balance?.toString(10) || '0'),
      },
    ],
    [fromAsset, setFromAmount],
  )

  return <Tabs data={percents} className='w-full justify-end' />
}

export function SwitchTokens() {
  const { fromAsset, toAsset, updateSearchParams } = useTwapContext()

  return (
    <EmphasisIconButton
      className='absolute top-0 right-0 bottom-0 left-0 z-10 m-auto'
      Icon={SwitchVerticalIcon}
      onClick={() => {
        if (!fromAsset || !toAsset) return
        updateSearchParams({
          inputCurrency: toAsset.address,
          outputCurrency: fromAsset.address,
        })
      }}
    />
  )
}
