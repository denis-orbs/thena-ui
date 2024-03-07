import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import useSWR from 'swr'
import { encodeRouteToPath, Trade } from 'thena-fusion-sdk'
import { CurrencyAmount, TradeType } from 'thena-sdk-core'

import { fusionQuoterAbi } from '@/constant/abi/fusion'
import Contracts from '@/constant/contracts'
import { callMulti } from '@/lib/contractActions'
import { useChainSettings } from '@/state/settings/hooks'

import { useAllV3Routes } from './useAllV3Routes'

export const V3TradeState = {
  LOADING: 'LOADING',
  INVALID: 'INVALID',
  NO_ROUTE_FOUND: 'NO_ROUTE_FOUND',
  VALID: 'VALID',
  SYNCING: 'SYNCING',
}

/**
 * Returns the best v3 trade for a desired exact input swap
 * @param amountIn the amount to swap in
 * @param currencyOut the desired output currency
 */
export const useBestV3TradeExactIn = (amountIn, currencyOut) => {
  const { networkId } = useChainSettings()

  const { routes, loading: routesLoading } = useAllV3Routes(amountIn?.currency, currencyOut)

  const quoteExactInInputs = useMemo(
    () =>
      routes.map(route => [
        encodeRouteToPath(route, false),
        amountIn ? `0x${amountIn.quotient.toString(16)}` : undefined,
      ]),
    [amountIn, routes],
  )

  const { data: quotesResults, isLoading } = useSWR(
    Boolean(quoteExactInInputs && quoteExactInInputs.length > 0) && ['fusion/quoteExactInput', quoteExactInInputs],
    async () => {
      const res = await callMulti(
        quoteExactInInputs.map(params => ({
          address: Contracts.fusionQuoter[networkId],
          abi: fusionQuoterAbi,
          functionName: 'quoteExactInput',
          args: params,
          chainId: networkId,
        })),
      )

      return res
    },
  )

  return useMemo(() => {
    if (!amountIn || !currencyOut || !quotesResults) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (routesLoading || isLoading) {
      return {
        state: V3TradeState.LOADING,
        trade: null,
      }
    }

    const { bestRoute, amountOut } = quotesResults.reduce(
      (currentBest, result, i) => {
        if (!result) return currentBest

        if (currentBest.amountOut === null) {
          return {
            bestRoute: routes[i],
            amountOut: result[0],
          }
        }
        if (currentBest.amountOut < result[0]) {
          return {
            bestRoute: routes[i],
            amountOut: result[0],
          }
        }

        return currentBest
      },
      {
        bestRoute: null,
        amountOut: null,
      },
    )

    if (!bestRoute || !amountOut) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      }
    }

    return {
      isLoading: isLoading || routesLoading,
      trade: Trade.createUncheckedTrade({
        route: bestRoute,
        tradeType: TradeType.EXACT_INPUT,
        inputAmount: amountIn,
        outputAmount: CurrencyAmount.fromRawAmount(currencyOut, new BigNumber(amountOut).toString()),
      }),
    }
  }, [amountIn, currencyOut, quotesResults, routes, routesLoading, isLoading])
}

/**
 * Returns the best v3 trade for a desired exact output swap
 * @param currencyIn the desired input currency
 * @param amountOut the amount to swap out
 */
export const useBestV3TradeExactOut = (currencyIn, amountOut) => {
  const { routes, loading: routesLoading } = useAllV3Routes(currencyIn, amountOut?.currency)
  const { networkId } = useChainSettings()

  const quoteExactOutInputs = useMemo(
    () =>
      routes.map(route => [
        encodeRouteToPath(route, true),
        amountOut ? `0x${amountOut.quotient.toString(16)}` : undefined,
      ]),
    [amountOut, routes],
  )

  const { data: quotesResults, isLoading } = useSWR(
    Boolean(quoteExactOutInputs && quoteExactOutInputs.length > 0) && ['fusion/quoteExactOutput', quoteExactOutInputs],
    async () => {
      const res = await callMulti(
        quoteExactOutInputs.map(params => ({
          address: Contracts.fusionQuoter[networkId],
          abi: fusionQuoterAbi,
          functionName: 'quoteExactOutput',
          args: params,
          chainId: networkId,
        })),
      )

      return res
    },
    {
      refreshInterval: 30000,
    },
  )

  return useMemo(() => {
    if (!amountOut || !currencyIn || !quotesResults) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (routesLoading || isLoading) {
      return {
        state: V3TradeState.LOADING,
        trade: null,
      }
    }

    const { bestRoute, amountIn } = quotesResults.reduce(
      (currentBest, result, i) => {
        if (!result) return currentBest

        if (currentBest.amountIn === null) {
          return {
            bestRoute: routes[i],
            amountIn: result[0],
          }
        }
        if (currentBest.amountIn > result[0]) {
          return {
            bestRoute: routes[i],
            amountIn: result[0],
          }
        }

        return currentBest
      },
      {
        bestRoute: null,
        amountIn: null,
      },
    )

    if (!bestRoute || !amountIn) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      }
    }

    return {
      state: isLoading,
      trade: Trade.createUncheckedTrade({
        route: bestRoute,
        tradeType: TradeType.EXACT_OUTPUT,
        inputAmount: CurrencyAmount.fromRawAmount(currencyIn, amountIn.toString()),
        outputAmount: amountOut,
      }),
    }
  }, [amountOut, currencyIn, quotesResults, routes, routesLoading, isLoading])
}
