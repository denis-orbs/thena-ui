import { useMemo } from 'react'
import { useReadContracts } from 'wagmi'

import { CHAINLINK_TOKEN } from '@/constant'
import { ERC20Abi } from '@/constant/abi'
import { useAssets } from '@/context/assetsContext'
import { fromWei } from '@/lib/utils'

import useWallet from './useWallet'

const useChainLINKData = () => {
  const { chainId } = useWallet()
  const { account } = useWallet()
  const assets = useAssets()

  const chainLinkAsset = useMemo(
    () => assets.find(asset => asset.address === CHAINLINK_TOKEN[chainId][0].address),
    [assets, chainId],
  )

  const { data: balanceOfChainLINKs, isLoading } = useReadContracts({
    contracts: CHAINLINK_TOKEN[chainId].map(token => ({
      abi: ERC20Abi,
      address: token.address,
      functionName: 'balanceOf',
      args: [account],
    })),
    query: {
      enabled: Boolean(account),
    },
  })

  const chainLinkData = useMemo(
    () =>
      CHAINLINK_TOKEN[chainId]
        .map((token, index) => ({
          ...token,
          balance: fromWei(balanceOfChainLINKs?.[index]?.result || 0n, token.decimals),
          logoURI: chainLinkAsset?.logoURI,
          price: chainLinkAsset?.price,
        }))
        .sort((a, b) => Number(b.balance) - Number(a.balance)),
    [chainId, balanceOfChainLINKs, chainLinkAsset],
  )
  return { chainLinkData: isLoading ? [] : chainLinkData }
}

export default useChainLINKData
