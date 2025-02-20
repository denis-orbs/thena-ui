import BigNumber from 'bignumber.js'
import { WBNB } from 'thena-sdk-core'
import { useSimulateContract } from 'wagmi'

import { getRouterContract } from '@/lib/contracts'
import { toWei } from '@/lib/utils'

export const useThenaQuote = (fromAsset, toAsset, fromAmount, networkId, enabled) => {
  const ThenaRouterV2Contract = getRouterContract(networkId)

  const amount = toWei(
    new BigNumber(fromAmount).decimalPlaces(fromAsset?.decimals ?? 18, BigNumber.ROUND_DOWN).toString(),
    fromAsset?.decimals,
  )

  const token0Address = fromAsset?.address === 'BNB' ? WBNB[networkId].address : fromAsset?.address
  const token1Address = toAsset?.address === 'BNB' ? WBNB[networkId].address : toAsset?.address

  return useSimulateContract({
    ...ThenaRouterV2Contract,
    functionName: 'getAmountOut',
    args: [amount, token0Address, token1Address],
    query: {
      enabled,
    },
  })
}
