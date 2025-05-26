import { useMemo } from 'react'
import { useReadContracts } from 'wagmi'

import { CHAINLINK_TOKEN } from '@/constant'
import { ERC20Abi } from '@/constant/abi'
import { useAssets } from '@/context/assetsContext'
import { fromWei } from '@/lib/utils'

import useWallet from './useWallet'

const useChainLINKData = () => {
  const { account, chainId } = useWallet()
  const assets = useAssets()

  const tokens = useMemo(() => CHAINLINK_TOKEN[chainId] ?? [], [chainId])

  const chainLinkAsset = useMemo(() => assets.find(asset => asset.address === tokens[0]?.address), [assets, tokens])
  const contracts = useMemo(() => {
    if (!account || tokens.length === 0) return []
    return tokens?.map(token => ({
      abi: ERC20Abi,
      address: token.address,
      functionName: 'balanceOf',
      args: [account],
    }))
  }, [tokens, account])

  const {
    data: balanceOfChainLINKs,
    isLoading,
    refetch,
  } = useReadContracts({
    contracts,
    query: {
      enabled: Boolean(account) && tokens.length > 0,
    },
  })
  const chainLinkData = useMemo(
    () =>
      CHAINLINK_TOKEN[chainId]
        ?.map((token, index) => ({
          ...token,
          balance: fromWei(balanceOfChainLINKs?.[index]?.result || 0n, token.decimals),
          logoURI: chainLinkAsset?.logoURI,
          price: chainLinkAsset?.price,
        }))
        .sort((a, b) => Number(b.balance) - Number(a.balance)),
    [chainId, balanceOfChainLINKs, chainLinkAsset],
  )

  return { chainLinkData: isLoading ? [] : chainLinkData, refetch }
}

export default useChainLINKData
