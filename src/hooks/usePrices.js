import { useEffect, useState } from 'react'

import Contracts from '@/constant/contracts'
import { useAssets } from '@/state/assets/hooks'
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

  useEffect(() => {
    if (assets.length > 0) {
      const theAsset = assets.find(asset => asset.address.toLowerCase() === Contracts.THE[networkId].toLowerCase())
      const bnbAsset = assets.find(asset => asset.address.toLowerCase() === Contracts.WBNB[networkId].toLowerCase())
      const pstakeAsset = assets.find(
        asset => asset.address.toLowerCase() === '0x4c882ec256823ee773b25b414d36f92ef58a7c0c',
      )
      const liveTHEAsset = assets.find(
        asset => asset.address.toLowerCase() === '0xcdc3a010a3473c0c4b2cb03d8489d6ba387b83cd',
      )
      setPrices({
        THE: theAsset?.price || 0,
        BNB: bnbAsset?.price || 0,
        PSTAKE: pstakeAsset?.price || 0,
        liveTHE: liveTHEAsset?.price || 0,
      })
    }
  }, [assets, networkId])

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

export default usePrices
