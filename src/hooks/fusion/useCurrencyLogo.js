import { useMemo } from 'react'

import { UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'

export const useCurrencyLogo = currency => {
  const assets = useAssets()
  return useMemo(
    () =>
      currency && assets
        ? assets.find(
            asset => asset.address.toLowerCase() === (currency.address ? currency.address.toLowerCase() : 'bnb'),
          )?.logoURI
        : UNKNOWN_LOGO,
    [assets, currency],
  )
}

export const useCurrencyPrice = currency => {
  const assets = useAssets()
  return useMemo(
    () =>
      currency && assets
        ? assets.find(
            asset => asset.address.toLowerCase() === (currency.address ? currency.address.toLowerCase() : 'bnb'),
          )?.price
        : 0,
    [assets, currency],
  )
}

export const useLogoFromAddress = address => {
  const assets = useAssets()
  return useMemo(
    () => assets.find(asset => asset.address.toLowerCase() === address?.toLowerCase())?.logoURI || UNKNOWN_LOGO,
    [assets, address],
  )
}
