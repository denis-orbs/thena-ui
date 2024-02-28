import { encodeRouteToPath, toHex } from 'thena-fusion-sdk'
import { CurrencyAmount, TradeType, validateAndParseAddress } from 'thena-sdk-core'
import invariant from 'tiny-invariant'
import { encodeFunctionData, zeroAddress } from 'viem'

import { fusionRouterAbi } from '@/constant/abi/fusion'

import { SelfPermit } from './selfPermit'

/**
 * Represents the Uniswap V2 SwapRouter, and has static methods for helping execute trades.
 */
export class SwapRouter extends SelfPermit {
  static getCalldata(func, args) {
    return encodeFunctionData({
      abi: fusionRouterAbi,
      functionName: func,
      args,
    })
  }

  /**
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
   * @param trade to produce call parameters for
   * @param options options for the call parameters
   */
  static swapCallParameters(trades, options) {
    if (!Array.isArray(trades)) {
      trades = [trades]
    }

    const sampleTrade = trades[0]
    const tokenIn = sampleTrade.inputAmount.currency.wrapped
    const tokenOut = sampleTrade.outputAmount.currency.wrapped

    // All trades should have the same starting and ending token.
    invariant(
      trades.every(trade => trade.inputAmount.currency.wrapped.equals(tokenIn)),
      'TOKEN_IN_DIFF',
    )
    invariant(
      trades.every(trade => trade.outputAmount.currency.wrapped.equals(tokenOut)),
      'TOKEN_OUT_DIFF',
    )

    const calldatas = []

    const ZERO_IN = CurrencyAmount.fromRawAmount(trades[0].inputAmount.currency, 0)
    const ZERO_OUT = CurrencyAmount.fromRawAmount(trades[0].outputAmount.currency, 0)

    const totalAmountOut = trades.reduce(
      (sum, trade) => sum.add(trade.minimumAmountOut(options.slippageTolerance)),
      ZERO_OUT,
    )

    // flag for whether a refund needs to happen
    const mustRefund = sampleTrade.inputAmount.currency.isNative && sampleTrade.tradeType === TradeType.EXACT_OUTPUT
    const inputIsNative = sampleTrade.inputAmount.currency.isNative
    // flags for whether funds should be send first to the router
    const outputIsNative = sampleTrade.outputAmount.currency.isNative
    const routerMustCustody = outputIsNative || !!options.fee

    const totalValue = inputIsNative
      ? trades.reduce((sum, trade) => sum.add(trade.maximumAmountIn(options.slippageTolerance)), ZERO_IN)
      : ZERO_IN

    // encode permit if necessary
    if (options.inputTokenPermit) {
      invariant(sampleTrade.inputAmount.currency.isToken, 'NON_TOKEN_PERMIT')
      calldatas.push(SwapRouter.encodePermit(sampleTrade.inputAmount.currency, options.inputTokenPermit))
    }

    const recipient = validateAndParseAddress(options.recipient)
    const deadline = toHex(options.deadline)

    for (const trade of trades) {
      for (const { route, inputAmount, outputAmount } of trade.swaps) {
        const amountIn = toHex(trade.maximumAmountIn(options.slippageTolerance, inputAmount).quotient)
        const amountOut = toHex(trade.minimumAmountOut(options.slippageTolerance, outputAmount).quotient)

        // flag for whether the trade is single hop or not
        const singleHop = route.pools.length === 1

        if (singleHop) {
          if (trade.tradeType === TradeType.EXACT_INPUT) {
            const exactInputSingleParams = {
              tokenIn: route.tokenPath[0].address,
              tokenOut: route.tokenPath[1].address,
              // fee: route.pools[0].fee,
              recipient: routerMustCustody ? zeroAddress : recipient,
              deadline,
              amountIn,
              amountOutMinimum: amountOut,
              limitSqrtPrice: toHex(options.sqrtPriceLimitX96 ?? 0),
            }
            calldatas.push(
              SwapRouter.getCalldata(
                options.feeOnTransfer && !inputIsNative
                  ? 'exactInputSingleSupportingFeeOnTransferTokens'
                  : 'exactInputSingle',
                [exactInputSingleParams],
              ),
            )
          } else {
            const exactOutputSingleParams = {
              tokenIn: route.tokenPath[0].address,
              tokenOut: route.tokenPath[1].address,
              fee: route.pools[0].fee,
              recipient: routerMustCustody ? zeroAddress : recipient,
              deadline,
              amountOut,
              amountInMaximum: amountIn,
              limitSqrtPrice: toHex(options.sqrtPriceLimitX96 ?? 0),
            }

            calldatas.push(SwapRouter.getCalldata('exactOutputSingle', [exactOutputSingleParams]))
          }
        } else {
          invariant(options.sqrtPriceLimitX96 === undefined, 'MULTIHOP_PRICE_LIMIT')

          const path = encodeRouteToPath(route, trade.tradeType === TradeType.EXACT_OUTPUT)

          if (trade.tradeType === TradeType.EXACT_INPUT) {
            const exactInputParams = {
              path,
              recipient: routerMustCustody ? zeroAddress : recipient,
              deadline,
              amountIn,
              amountOutMinimum: amountOut,
            }

            calldatas.push(SwapRouter.getCalldata('exactInput', [exactInputParams]))
          } else {
            const exactOutputParams = {
              path,
              recipient: routerMustCustody ? zeroAddress : recipient,
              deadline,
              amountOut,
              amountInMaximum: amountIn,
            }

            calldatas.push(SwapRouter.getCalldata('exactOutput', [exactOutputParams]))
          }
        }
      }
    }

    // unwrap
    if (routerMustCustody) {
      if (!options.fee) {
        calldatas.push(SwapRouter.getCalldata('unwrapWNativeToken', [toHex(totalAmountOut.quotient), recipient]))
      } else {
        const feeRecipient = validateAndParseAddress(options.fee.recipient)
        const fee = toHex(options.fee.fee.multiply(10_000).quotient)
        if (outputIsNative) {
          calldatas.push(
            SwapRouter.getCalldata('unwrapWNativeTokenWithFee', [
              toHex(totalAmountOut.quotient),
              recipient,
              fee,
              feeRecipient,
            ]),
          )
        } else {
          calldatas.push(
            SwapRouter.getCalldata('sweepTokenWithFee', [
              sampleTrade.outputAmount.currency.wrapped.address,
              toHex(totalAmountOut.quotient),
              recipient,
              fee,
              feeRecipient,
            ]),
          )
        }
      }
    }

    // refund
    if (mustRefund) {
      calldatas.push(SwapRouter.getCalldata('refundNativeToken'))
    }

    return {
      calldata: calldatas.length === 1 ? calldatas[0] : SwapRouter.getCalldata('multicall', [calldatas]),
      value: toHex(totalValue.quotient),
    }
  }
}
