import { useMemo } from 'react'
import useSWR from 'swr'

import { GAMMA_TYPES, ICHI_TYPES } from '@/constant'
import { HypervisorV2ABI } from '@/constant/abi/gamma/HypervisorV2ABI'
import { HypervisorV3ABI } from '@/constant/abi/gamma/HypervisorV3ABI'
import { IchiVaultV2ABI } from '@/constant/abi/ichi/IchiVaultV2ABI'
import { IchiVaultV3ABI } from '@/constant/abi/ichi/IchiVaultV3ABI'
import { callMulti } from '@/lib/contractActions'

const strategyAbi = {
  2: {
    ichi: IchiVaultV2ABI,
    gamma: HypervisorV2ABI,
  },
  3: {
    ichi: IchiVaultV3ABI,
    gamma: HypervisorV3ABI,
  },
}

const fetchStrategyInfo = async (chainId, strategy) => {
  if (![...GAMMA_TYPES, ...ICHI_TYPES].includes(strategy.title)) return

  const { address, version } = strategy
  const isGamma = GAMMA_TYPES.includes(strategy.title)
  const abi = isGamma ? strategyAbi[version].gamma : strategyAbi[version].ichi

  const values = await callMulti([
    { address, abi, functionName: 'baseLower', args: [], chainId },
    { address, abi, functionName: 'baseUpper', args: [], chainId },
    { address, abi, functionName: 'currentTick', args: [], chainId },
  ])

  const lowerValue = 1.0001 ** Number(values[0])
  const upperValue = 1.0001 ** Number(values[1])
  const currentValue = 1.0001 ** Number(values[2])

  return {
    address,
    min: lowerValue,
    max: upperValue,
    current: currentValue,
  }
}

export const useAutomaticRange = (position, strategy, networkId) => {
  const { data: preset } = useSWR(
    strategy.address &&
      [...GAMMA_TYPES, ...ICHI_TYPES].includes(strategy.title) &&
      position && ['strategy/info', strategy.address],
    () => fetchStrategyInfo(networkId, strategy),
    { refreshInterval: 0 },
  )

  const [priceLower, priceUpper, priceCurrent] = useMemo(() => {
    if (!preset) return [0, Infinity, 0]
    return [preset.min, preset.max, preset.current]
  }, [preset])

  return [priceLower, priceUpper, priceCurrent]
}
