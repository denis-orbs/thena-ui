import { useReadContract } from 'wagmi'

import { algebraPoolV3, thenaBasePluginAbi } from '@/constant/abi'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { getAlgebraFactoryContract } from '@/lib/contracts'

import useWallet from '../useWallet'

/**
 * usePoolAlgebraInfo Hook
 * Provides information about Algebra pool v3.
 *
 * @param {string} token0Address - The address of the first token in the pool.
 * @param {string} token1Address - The address of the second token in the pool.
 * @returns {Object} An object with the following properties:
 *   - poolAddress: The address of the pool.
 *   - pluginAddress: The address of the plugin associated with the pool.
 *   - incentiveAddress: The address of the incentive contract associated with the pool.
 */
export const usePoolAlgebraInfo = (token0Address, token1Address) => {
  const { chainId } = useWallet()
  const currency0 = useCurrency(token0Address)
  const currency1 = useCurrency(token1Address)
  const [baseCurrency, quoteCurrency] = currency0.sortsBefore(currency1)
    ? [currency0, currency1]
    : [currency1, currency0]

  const algebraFactory = getAlgebraFactoryContract(chainId, 3)
  const { data: poolAddress } = useReadContract({
    ...algebraFactory,
    functionName: 'computePoolAddress',
    args: [baseCurrency.address, quoteCurrency.address],
    query: {
      enabled: !!token0Address && !!token1Address,
      staleTime: Infinity,
    },
  })

  const { data: pluginAddress } = useReadContract({
    address: poolAddress,
    abi: algebraPoolV3,
    functionName: 'plugin',
    query: {
      enabled: !!poolAddress,
      staleTime: Infinity,
    },
  })

  const { data: incentiveAddress } = useReadContract({
    address: pluginAddress,
    abi: thenaBasePluginAbi,
    functionName: 'incentive',
    query: {
      enabled: !!pluginAddress,
      staleTime: Infinity,
    },
  })

  return { poolAddress, pluginAddress, incentiveAddress }
}
