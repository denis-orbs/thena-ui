import BigNumber from 'bignumber.js'
import { WBNB } from 'thena-sdk-core'
import { useReadContract } from 'wagmi'

import { getSolidlyRouterContract } from '@/lib/contracts'
import { toWei } from '@/utils/utils'

export const useSolidlyQuote = (fromAsset, toAsset, fromAmount, networkId, enabled) => {
  // NOTE: If CL pool, use fusionQuoter contract
  const SolidlyRouterContract = getSolidlyRouterContract(networkId)

  const amount = toWei(
    new BigNumber(fromAmount).decimalPlaces(fromAsset?.decimals ?? 18, BigNumber.ROUND_DOWN).toString(),
    fromAsset?.decimals,
  )

  const token0Address = fromAsset?.address === 'BNB' ? WBNB[networkId].address : fromAsset?.address
  const token1Address = toAsset?.address === 'BNB' ? WBNB[networkId].address : toAsset?.address

  return useReadContract({
    ...SolidlyRouterContract,
    functionName: 'getAmountOut',
    args: [amount, token0Address, token1Address],
    query: {
      enabled,
    },
  })
}
