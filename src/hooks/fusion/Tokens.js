import { useMemo } from 'react'
import { BNB, ChainId, Token } from 'thena-sdk-core'

import { useAssets } from '@/state/assets/hooks'
import { useChainSettings } from '@/state/settings/hooks'

// undefined if invalid or does not exist
// otherwise returns the token
export function useToken(tokenAddress) {
  const assets = useAssets()

  return useMemo(() => {
    if (!tokenAddress) return undefined
    const asset = assets.find(item => item.address.toLowerCase() === tokenAddress.toLowerCase())
    if (!asset) return undefined
    return new Token(asset.chainId, asset.address, asset.decimals, asset.symbol, asset.name)
  }, [assets, tokenAddress])
}

export const useCurrency = currencyId => {
  const { networkId } = useChainSettings()
  const isBNB = currencyId?.toUpperCase() === 'BNB'
  const token = useToken(isBNB ? undefined : currencyId)
  return isBNB ? BNB.onChain(networkId) : token
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
