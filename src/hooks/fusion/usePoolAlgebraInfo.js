import { useReadContract, useReadContracts } from 'wagmi'

import { algebraPoolV3, basePluginAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
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
  const [baseCurrency, quoteCurrency] = currency0.wrapped.sortsBefore(currency1.wrapped)
    ? [currency0.wrapped, currency1.wrapped]
    : [currency1.wrapped, currency0.wrapped]

  const algebraFactory = getAlgebraFactoryContract(chainId, 3)
  const { data: poolAddresses } = useReadContracts({
    contracts: [
      {
        ...algebraFactory,
        functionName: 'computePoolAddress',
        args: [baseCurrency.address, quoteCurrency.address],
      },
      {
        ...algebraFactory,
        functionName: 'computeCustomPoolAddress',
        args: [Contracts.pluginFactory[chainId], baseCurrency.address, quoteCurrency.address],
      },
    ],
    query: {
      enabled: !!token0Address && !!token1Address,
      staleTime: Infinity,
    },
  })

  const poolAddress = poolAddresses?.at(0).result
  const customPoolAddress = poolAddresses?.at(1).result

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
    abi: basePluginAbi,
    functionName: 'incentive',
    query: {
      enabled: !!pluginAddress,
      staleTime: Infinity,
    },
  })

  return { poolAddress, customPoolAddress, pluginAddress, incentiveAddress }
}

const POOLS_ADMINISTRATOR_ROLE = '0xb73ce166ead2f8e9add217713a7989e4edfba9625f71dfd2516204bb67ad3442'
const PLUGIN_FACTORY_ADMINISTRATOR = '0x267da724c255813ae00f4522fe843cb70148a4b8099cbc5af64f9a4151e55ed6'

export const useGetAdministrator = () => {
  const { chainId } = useWallet()

  const algebraFactory = getAlgebraFactoryContract(chainId, 3)

  const { data: roleMemberCounts } = useReadContracts({
    contracts: [
      {
        ...algebraFactory,
        functionName: 'getRoleMemberCount',
        args: [POOLS_ADMINISTRATOR_ROLE],
      },
      {
        ...algebraFactory,
        functionName: 'getRoleMemberCount',
        args: [PLUGIN_FACTORY_ADMINISTRATOR],
      },
    ],
    query: {
      staleTime: Infinity,
    },
  })

  const poolAdministratorCount = roleMemberCounts?.at(0).result ?? 0n
  const pluginAdministratorCount = roleMemberCounts?.at(1).result ?? 0n

  const { data: poolAddminMembers } = useReadContracts({
    contracts: Array.from({ length: Number(poolAdministratorCount) }).map((_, index) => ({
      ...algebraFactory,
      functionName: 'getRoleMember',
      args: [POOLS_ADMINISTRATOR_ROLE, index],
    })),
    query: {
      staleTime: Infinity,
      enabled: poolAdministratorCount !== 0n,
    },
  })

  const { data: plugAdminMembers } = useReadContracts({
    contracts: Array.from({ length: Number(pluginAdministratorCount) }).map((_, index) => ({
      ...algebraFactory,
      functionName: 'getRoleMember',
      args: [PLUGIN_FACTORY_ADMINISTRATOR, index],
    })),
    query: {
      staleTime: Infinity,
      enabled: pluginAdministratorCount !== 0n,
    },
  })

  return {
    poolAdministrators: poolAddminMembers?.map(data => data.result) ?? [],
    pluginAdministrators: plugAdminMembers?.map(data => data.result) ?? [],
  }
}
