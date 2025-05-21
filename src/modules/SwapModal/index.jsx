import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'
import { useBalance } from 'wagmi'

import Modal from '@/components/modal'
import { SWAP_TYPES } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useWrap } from '@/hooks/useSwap'
import useWallet from '@/hooks/useWallet'
import { fromWei } from '@/lib/utils'
import SwapBest from '@/modules/SwapModal/SwapBest'
import SwapFusion from '@/modules/SwapModal/SwapFusion'
import { useLocalTokens } from '@/state/localTokens/store'
import { useChainSettings } from '@/state/settings/hooks'

function SwapModal({
  inputCurrency: inputCurrencyParam,
  outputCurrency: outputCurrencyParam,
  open,
  setOpen,
  disabledChangeOutputCurrency = false,
}) {
  const searchParams = useSearchParams()

  const [inputCurrency, setInputCurrency] = useState(inputCurrencyParam)
  const [outputCurrency, setOutputCurrency] = useState(outputCurrencyParam)
  const [fromAsset, setFromAsset] = useState(null)
  const [toAsset, setToAsset] = useState(null)
  const [swapType, setSwapType] = useState(searchParams.get('swapType') || SWAP_TYPES.SWAP)

  const { networkId } = useChainSettings()
  const assets = useAssets()
  const { onWrap, onUnwrap, pending: wrapPending } = useWrap()
  const { account, chainId } = useWallet()
  const { localTokens } = useLocalTokens()

  const { data: tokenFromBalance } = useBalance({
    token: fromAsset?.address ?? '',
    address: account,
    chainId,
    query: {
      enabled: Boolean(fromAsset?.isFromStorage && account),
    },
  })

  const { data: tokenToBalance } = useBalance({
    token: toAsset?.address ?? '',
    chainId,
    address: account,
    query: {
      enabled: Boolean(toAsset?.isFromStorage && account),
    },
  })

  const { from, to } = useMemo(() => {
    if (!assets || !assets.length) return { from: null, to: null }

    const assetList = localTokens.concat(assets)

    const fromCurrency = inputCurrency
      ? assetList.find(asset => asset.address.toLowerCase() === inputCurrency.toLowerCase())
      : null

    const toCurrency = outputCurrency
      ? assetList.find(asset => asset.address.toLowerCase() === outputCurrency.toLowerCase())
      : null

    return {
      from: fromCurrency,
      to: toCurrency,
    }
  }, [assets, localTokens, inputCurrency, outputCurrency])

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

  useEffect(() => {
    const fromBalance = tokenFromBalance?.value
    if (from) {
      setFromAsset({
        ...from,
        balance: fromBalance ? fromWei(fromBalance, from.decimals) : from.balance,
      })
    }
  }, [from, tokenFromBalance?.value])

  useEffect(() => {
    const toBalance = tokenToBalance?.value

    if (to) {
      setToAsset({
        ...to,
        balance: toBalance ? fromWei(toBalance, to.decimals) : to.balance,
      })
    }
  }, [to, tokenToBalance?.value])

  return (
    <Modal
      isOpen={open}
      closeModal={() => {
        setOpen(false)
      }}
      width={480}
      title='Swap'
    >
      <div className='flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start 2xl:gap-10'>
        {networkId === ChainId.BSC && (
          <SwapBest
            fromAsset={fromAsset}
            toAsset={toAsset}
            isWrap={isWrap}
            isUnwrap={isUnwrap}
            onWrap={onWrap}
            onUnwrap={onUnwrap}
            wrapPending={wrapPending}
            setInputCurrency={setInputCurrency}
            setOutputCurrency={setOutputCurrency}
            disabledChangeOutputCurrency={disabledChangeOutputCurrency}
            setSwapType={setSwapType}
            swapType={swapType}
          />
        )}
        {networkId === ChainId.OPBNB && (
          <SwapFusion
            fromAsset={fromAsset}
            toAsset={toAsset}
            setInputCurrency={setInputCurrency}
            setOutputCurrency={setOutputCurrency}
            disabledChangeOutputCurrency={disabledChangeOutputCurrency}
            isWrap={isWrap}
            isUnwrap={isUnwrap}
            onWrap={onWrap}
            onUnwrap={onUnwrap}
            wrapPending={wrapPending}
          />
        )}
      </div>
    </Modal>
  )
}

export default SwapModal
