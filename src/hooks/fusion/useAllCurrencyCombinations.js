import { useMemo } from 'react'

import { ADDITIONAL_BASES, BASES_TO_CHECK_TRADES_AGAINST } from '@/constant/fusion/routing'
import { useChainSettings } from '@/state/settings/hooks'

export const useAllCurrencyCombinations = (currencyA, currencyB) => {
  const { networkId } = useChainSettings()

  const [tokenA, tokenB] = networkId ? [currencyA?.wrapped, currencyB?.wrapped] : [undefined, undefined]

  const bases = useMemo(() => {
    if (!networkId) return []

    const common = BASES_TO_CHECK_TRADES_AGAINST[networkId] ?? []
    const additionalA = tokenA ? ADDITIONAL_BASES[networkId]?.[tokenA.address] ?? [] : []
    const additionalB = tokenB ? ADDITIONAL_BASES[networkId]?.[tokenB.address] ?? [] : []

    return [...common, ...additionalA, ...additionalB]
  }, [networkId, tokenA, tokenB])

  const basePairs = useMemo(
    () => bases.flatMap(base => bases.map(otherBase => [base, otherBase])).filter(([t0, t1]) => !t0.equals(t1)),
    [bases],
  )

  return useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            [tokenA, tokenB],
            // token A against all bases
            ...bases.map(base => [tokenA, base]),
            // token B against all bases
            ...bases.map(base => [tokenB, base]),
            // each base against all bases
            ...basePairs,
          ]
            // filter out invalid pairs comprised of the same asset (e.g. WETH<>WETH)
            .filter(([t0, t1]) => !t0.equals(t1))
            // filter out duplicate pairs
            .filter(([t0, t1], i, otherPairs) => {
              // find the first index in the array at which there are the same 2 tokens as the current
              const firstIndexInOtherPairs = otherPairs.findIndex(
                ([t0Other, t1Other]) =>
                  (t0.equals(t0Other) && t1.equals(t1Other)) || (t0.equals(t1Other) && t1.equals(t0Other)),
              )
              // only accept the first occurrence of the same 2 tokens
              return firstIndexInOtherPairs === i
            })
        : // optionally filter out some pairs for tokens with custom bases defined
          // .filter(([tokenA, tokenB]) => {
          //   if (!chainId) return true
          //   const customBases = CUSTOM_BASES[chainId]

          //   const customBasesA = customBases?.[tokenA.address]
          //   const customBasesB = customBases?.[tokenB.address]

          //   if (!customBasesA && !customBasesB) return true

          //   if (customBasesA && !customBasesA.find((base) => tokenB.equals(base))) return false
          //   if (customBasesB && !customBasesB.find((base) => tokenA.equals(base))) return false

          //   return true
          // })
          [],
    [tokenA, tokenB, bases, basePairs],
  )
}
