import { useMemo } from 'react'
import { Route } from 'thena-fusion-sdk'

import { useChainSettings } from '@/state/settings/hooks'

import { useFusionSwapPools } from './useFusionSwapPools'

/**
 * Returns true if poolA is equivalent to poolB
 * @param poolA one of the two pools
 * @param poolB the other pool
 */
function poolEquals(poolA, poolB) {
  return (
    poolA === poolB ||
    (poolA.token0.equals(poolB.token0) && poolA.token1.equals(poolB.token1) && poolA.fee === poolB.fee)
  )
}

const computeAllRoutes = (
  currencyIn,
  currencyOut,
  pools,
  chainId,
  currentPath,
  allPaths,
  startCurrencyIn = currencyIn,
  maxHops = 2,
) => {
  const tokenIn = currencyIn?.wrapped
  const tokenOut = currencyOut?.wrapped

  if (!tokenIn || !tokenOut) throw new Error('Missing tokenIn/tokenOut')

  for (const pool of pools) {
    // eslint-disable-next-line no-continue
    if (!pool.involvesToken(tokenIn) || currentPath.find(pathPool => poolEquals(pool, pathPool))) continue

    const outputToken = pool.token0.equals(tokenIn) ? pool.token1 : pool.token0
    if (outputToken.equals(tokenOut)) {
      allPaths.push(new Route([...currentPath, pool], startCurrencyIn, currencyOut))
    } else if (maxHops > 1) {
      computeAllRoutes(
        outputToken,
        currencyOut,
        pools,
        chainId,
        [...currentPath, pool],
        allPaths,
        startCurrencyIn,
        maxHops - 1,
      )
    }
  }

  return allPaths
}

/**
 * Returns all the routes from an input currency to an output currency
 * @param currencyIn the input currency
 * @param currencyOut the output currency
 */
export const useAllV3Routes = (currencyIn, currencyOut) => {
  const { pools, loading: poolsLoading } = useFusionSwapPools(currencyIn, currencyOut)
  const { networkId } = useChainSettings()

  const singleHopOnly = false
  // const [singleHopOnly] = useUserSingleHopOnly()

  return useMemo(() => {
    if (poolsLoading || !pools || !currencyIn || !currencyOut) {
      return {
        loading: true,
        routes: [],
      }
    }

    // Hack
    // const singleIfWrapped = (currencyIn.isNative || currencyOut.isNative)
    const singleIfWrapped = false

    const routes = computeAllRoutes(
      currencyIn,
      currencyOut,
      pools,
      networkId,
      [],
      [],
      currencyIn,
      singleHopOnly || singleIfWrapped ? 1 : 3,
    )

    return { loading: false, routes }
  }, [currencyIn, currencyOut, pools, poolsLoading, singleHopOnly, networkId])
}
