/* eslint-disable max-len */
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useGetV2SolidlyPairs } from '@/state/pools/hooks'

const poolsUrlPrefix = '/pools/add-liquidity'

export const useBackURL = () => {
  const params = useSearchParams()
  const { pairs } = usePairs()
  const { v2Pairs } = useGetV2SolidlyPairs(PAIR_TYPES.CLASSIC)

  const step = Number(params.get('step') ?? 1)
  const back = Number(params.get('back'))
  const pairType = params.get('pairType') || PAIR_TYPES.LSD
  const firstAddress = params.get('firstAddress')
  const secondAddress = params.get('secondAddress')
  const poolAddress = params.get('poolAddress')

  const backUrl = useMemo(() => {
    if (back === 2) return '/dashboard'

    if (back === 3) return '/analytics'

    if (back === 4) {
      if (poolAddress) return `/analytics/pairs/${poolAddress}?back=3`
      return '/analytics/pairs'
    }

    if (back === 5) return '/analytics/tokens'

    if (step === 1 || back === 1) return '/pools'

    let step1Url = `${poolsUrlPrefix}?step=1&pairType=${pairType}`
    let step2Url = `${poolsUrlPrefix}?step=2&pairType=${pairType}`

    if (poolAddress) {
      const found = [...pairs, ...v2Pairs].find(pair => pair.address === poolAddress)
      if (found) {
        step1Url = `${poolsUrlPrefix}?step=1&pairType=${found.type}`
        step2Url = `${poolsUrlPrefix}?step=2&pairType=${found.type}&firstAddress=${found.token0.address}&secondAddress=${found.token1.address}`
      }
    } else if (firstAddress && secondAddress) {
      step2Url = `${poolsUrlPrefix}?step=2&pairType=${pairType}&firstAddress=${firstAddress}&secondAddress=${secondAddress}`
    }

    if (step === 2) return step1Url
    if (step === 3) return step2Url

    return '/pools'
  }, [back, firstAddress, pairType, pairs, poolAddress, secondAddress, step, v2Pairs])

  return backUrl
}
