import BigNumber from 'bignumber.js'
import { useCallback, useMemo } from 'react'
import { BNB, ChainId, Token } from 'thena-sdk-core'

import { UNKNOWN_LOGO } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import { getTokenInfo } from '@/lib/helper'
import { useLocalTokens } from '@/state/localTokens/store'
import { useChainSettings } from '@/state/settings/hooks'

export function useGetAsset(tokenAddress) {
  const assets = useAssets()
  const customAssets = useCustomAssets()
  const { localTokens } = useLocalTokens()

  return useMemo(() => {
    if (!tokenAddress) return undefined
    let asset = getTokenInfo({ tokenAddress, assets, customAssets })

    if (!asset) {
      asset = localTokens.find(tk => tk.address.toLowerCase() === tokenAddress.toLowerCase())
    }

    return asset
  }, [assets, customAssets, localTokens, tokenAddress])
}

export function useGetAssetFn() {
  const assets = useAssets()
  const customAssets = useCustomAssets()
  const { localTokens } = useLocalTokens()

  const getAsset = useCallback(
    tokenAddress => {
      if (!tokenAddress) return undefined
      let asset = getTokenInfo({ tokenAddress, assets, customAssets })

      if (!asset) {
        asset = localTokens.find(tk => tk.address.toLowerCase() === tokenAddress.toLowerCase())
      }

      return asset
    },
    [assets, customAssets, localTokens],
  )

  return { getAsset }
}
// undefined if invalid or does not exist
// otherwise returns the token
export function useToken(tokenAddress) {
  const asset = useGetAsset(tokenAddress)
  return useMemo(() => {
    if (!asset) return undefined
    const token = new Token(asset.chainId, asset.address, asset.decimals, asset.symbol, asset.name)
    token.logoURI = asset.logoURI ?? UNKNOWN_LOGO
    return token
  }, [asset])
}

export const getToken = (tokenAddress, getAsset = () => {}) => {
  const asset = getAsset(tokenAddress)
  if (!asset) return undefined
  const token = new Token(asset.chainId, asset.address, asset.decimals, asset.symbol, asset.name)
  token.logoURI = asset.logoURI ?? UNKNOWN_LOGO
  return token
}

export const useCurrency = tokenAddress => {
  const { networkId } = useChainSettings()
  const isBNB = tokenAddress?.toUpperCase() === 'BNB'
  const token = useToken(isBNB ? undefined : tokenAddress)
  if (isBNB) {
    const currency = BNB.onChain(networkId)
    currency.logoURI = 'https://cdn.thena.fi/assets/WBNB.png'
    currency.address = 'BNB'
    return currency
  }
  return token
}

export const getCurrency = (tokenAddress, chainId, getAsset = () => {}) => {
  const isBNB = tokenAddress?.toUpperCase() === 'BNB'
  const asset = getAsset(isBNB ? undefined : tokenAddress)
  if (isBNB) {
    const currency = BNB.onChain(chainId)
    currency.logoURI = 'https://cdn.thena.fi/assets/WBNB.png'
    currency.address = 'BNB'
    return currency
  }
  const token = !asset ? undefined : new Token(asset.chainId, asset.address, asset.decimals, asset.symbol, asset.name)
  if (token) {
    token.logoURI = asset.logoURI ?? UNKNOWN_LOGO
    return token
  }
  return token
}

const STABLE_TOKENS = {
  [ChainId.BSC]: {
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    DAI: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
    DEI: '0xDE1E704dae0B4051e80DAbB26ab6ad6c12262DA0',
    USD: '0xe80772eaf6e2e18b651f160bc9158b2a5cafca65',
    ETS: '0x5B852898CD47d2Be1d77D30377b3642290f5Ec75',
    HAY: '0x0782b6d8c4551B9760e74c0545a9bCD90bdc41E5',
    FRAX: '0x90c97f71e18723b0cf0dfa30ee176ab653e89f40',
    CUSD: '0xFa4BA88Cf97e282c505BEa095297786c16070129',
    MAI: '0x3F56e0c36d275367b8C502090EDF38289b3dEa0d',
    DOLA: '0x2F29Bc0FFAF9bff337b31CBe6CB5Fb3bf12e5840',
    DUSD: '0x8ec1877698acf262fe8ad8a295ad94d6ea258988',
    CASH: '0x54c331bb7d32fbfc17bc9accab2e2d12d0d1b222',
    USDV: '0x953e94caf91a1e32337d0548b9274f337920edfa',
  },
  [ChainId.OPBNB]: {
    USDT: '0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3',
    FDUSD: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
  },
  97: {},
}

export const useStableTokens = () => {
  const assets = useAssets()
  return useMemo(
    () =>
      assets.length > 0
        ? assets
            .filter(item =>
              Object.values(STABLE_TOKENS[item.chainId]).find(
                asset => asset.toLowerCase() === item.address.toLowerCase(),
              ),
            )
            .map(stable => new Token(stable.chainId, stable.address, stable.decimals, stable.symbol, stable.name))
        : [],
    [assets],
  )
}

export const useTokenBalance = (token, alowDouble) => {
  const assets = useAssets()
  const { networkId } = useChainSettings()
  const bnbBalance = useMemo(() => assets.find(ele => ele.address === 'BNB')?.balance || new BigNumber(0), [assets])
  const wbnbBalance = useMemo(
    () => assets.find(ele => ele.address === Contracts.WBNB[networkId].toLowerCase())?.balance || new BigNumber(0),
    [assets, networkId],
  )
  const isDouble = useMemo(() => token?.symbol === 'BNB' || token?.name === 'Wrapped BNB', [token])
  const balance = useMemo(() => {
    if (isDouble && alowDouble) {
      return wbnbBalance.plus(bnbBalance)
    }
    return token?.balance
  }, [isDouble, alowDouble, token?.balance, wbnbBalance, bnbBalance])

  if (!token) {
    return { balance: new BigNumber(0), isDouble: false }
  }

  return { balance, isDouble: alowDouble ? isDouble : false }
}

export const useTokenBalanceFn = () => {
  const assets = useAssets()
  const { networkId } = useChainSettings()

  const bnbBalance = useMemo(() => assets.find(ele => ele.address === 'BNB')?.balance || new BigNumber(0), [assets])
  const wbnbBalance = useMemo(
    () => assets.find(ele => ele.address === Contracts.WBNB[networkId].toLowerCase())?.balance || new BigNumber(0),
    [assets, networkId],
  )

  const getBalance = useCallback(
    (token, alowDouble) => {
      const isDouble = token?.symbol === 'BNB' || token?.name === 'Wrapped BNB'

      if (!token) {
        return { balance: new BigNumber(0), isDouble: false }
      }

      if (isDouble && alowDouble) {
        return { balance: wbnbBalance.plus(bnbBalance), isDouble: true }
      }
      return { balance: token?.balance, isDouble: alowDouble ? isDouble : false }
    },
    [bnbBalance, wbnbBalance],
  )

  return { getBalance }
}
