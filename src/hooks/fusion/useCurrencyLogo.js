import { useMemo } from 'react'

import { useAssets } from '@/state/assets/hooks'

export const useCurrencyLogo = currency => {
  const assets = useAssets()
  return useMemo(
    () =>
      currency && assets
        ? assets.find(asset => asset.address === (currency.address ? currency.address.toLowerCase() : 'BNB')).logoURI
        : null,
    [assets, currency],
  )
}

export const useCurrencyPrice = currency => {
  const assets = useAssets()
  return useMemo(
    () =>
      currency && assets
        ? assets.find(asset => asset.address === (currency.address ? currency.address.toLowerCase() : 'BNB')).price
        : null,
    [assets, currency],
  )
}

export const useLogoFromAddress = address => {
  const assets = useAssets()
  return useMemo(
    () =>
      assets.find(asset => asset.address === address?.toLowerCase())?.logoURI ||
      'https://cdn.thena.fi/assets/UKNOWN.png',
    [assets, address],
  )
}
