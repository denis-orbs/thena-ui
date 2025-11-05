import { useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { erc20Abi } from 'viem'
import { useAccount, useReadContract } from 'wagmi'

import { fetchAssets } from '@/lib/api'
import { fromWei } from '@/lib/utils'
import { useSettings } from '@/state/settings/hooks'

export const useAsset = (networkId, address) => {
  const { liquidityHubEnabled } = useSettings()
  const { address: account } = useAccount()
  const { data: assets = [] } = useSWRImmutable(
    ['assets/total', networkId],
    async () => {
      const data = await fetchAssets(networkId, liquidityHubEnabled)
      return data
    },
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
    },
  )

  const asset = useMemo(
    () => assets.find(item => item.address.toLowerCase() === address.toLowerCase()),
    [assets, address],
  )

  const { data: balanceOf } = useReadContract({
    abi: erc20Abi,
    address: asset?.address,
    functionName: 'balanceOf',
    args: [account],
    query: {
      enabled: !!asset && Boolean(account),
      refetchInterval: 15000,
      revalidateOnFocus: false,
    },
  })

  return asset
    ? {
        ...asset,
        balance: fromWei(balanceOf || 0n, asset.decimals || 18),
        totalValue: Number(fromWei(balanceOf || 0n, asset.decimals || 18)) * Number(asset.price),
      }
    : null
}
