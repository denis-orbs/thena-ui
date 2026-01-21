import { useCallback, useEffect, useMemo, useState } from 'react'

import { CHAINLINK_TOKEN } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useChainSettings } from '@/state/settings/hooks'

const usePrices = () => {
  const [prices, setPrices] = useState({
    THE: 0,
    BNB: 0,
    ETH: 0,
    PSTAKE: 0,
    liveTHE: 0,
  })
  const assets = useAssets()
  const { networkId } = useChainSettings()

  const memoPrices = useMemo(() => {
    if (assets.length === 0) return prices
    const theAsset = assets.find(asset => asset.address.toLowerCase() === Contracts.THE[networkId].toLowerCase())
    const bnbAsset = assets.find(asset => asset.address.toLowerCase() === Contracts.WBNB[networkId].toLowerCase())
    const pstakeAsset = assets.find(
      asset => asset.address.toLowerCase() === '0x4c882ec256823ee773b25b414d36f92ef58a7c0c',
    )
    const liveTHEAsset = assets.find(
      asset => asset.address.toLowerCase() === '0xcdc3a010a3473c0c4b2cb03d8489d6ba387b83cd',
    )

    const chainLinkPrice = assets.find(
      asset => asset.address.toLowerCase() === CHAINLINK_TOKEN[networkId]?.[0]?.address?.toLowerCase(),
    )
    return {
      THE: theAsset?.price || 0,
      BNB: bnbAsset?.price || 0,
      PSTAKE: pstakeAsset?.price || 0,
      liveTHE: liveTHEAsset?.price || 0,
      CHAINLINK: chainLinkPrice?.price || 0,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, networkId])

  useEffect(() => {
    if (
      memoPrices.THE !== prices.THE ||
      memoPrices.BNB !== prices.BNB ||
      memoPrices.PSTAKE !== prices.PSTAKE ||
      memoPrices.liveTHE !== prices.liveTHE ||
      memoPrices.CHAINLINK !== prices.CHAINLINK
    ) {
      setPrices(memoPrices)
    }
  }, [memoPrices, prices])

  return prices
}

export const useTokenPrice = address => {
  const [price, setPrice] = useState(0)
  const assets = useAssets()

  useEffect(() => {
    if (assets.length > 0) {
      const asset = assets.find(ele => ele.address.toLowerCase() === address.toLowerCase())
      setPrice(asset ? asset.price : 0)
    }
  }, [assets, address])

  return price
}

export const useTokenUSDValue = () => {
  const assets = useAssets()
  const getValueTokenAmountToUSD = useCallback(
    (address, amount) => {
      const token = assets.find(item => item?.address?.toLowerCase() === address?.toLowerCase())
      return (token?.price || 0) * amount
    },
    [assets],
  )
  return { getValueTokenAmountToUSD }
}

export default usePrices
