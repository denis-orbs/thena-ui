import { useCallback, useState } from 'react'
import { TradeType } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'
import { usePublicClient } from 'wagmi'

import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract } from '@/lib/contracts'
import { isZero } from '@/lib/fusion'
import { SwapRouter } from '@/lib/fusion/entities/swapRouter'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param account the ENS name or address of the recipient of the swap output
 * @param signatureData the signature data of the permit of the input token amount, if available
 */
function useSwapCallArguments(
  trade, // trade to execute, required
  allowedSlippage, // in bips
  recipient,
  deadline,
  networkId,
) {
  if (!trade || !recipient || !recipient || !deadline) return []

  const swapRouterAddress = Contracts.fusionRouter[networkId]

  if (!swapRouterAddress) return []

  // if (!routerContract) return []
  const swapMethods = []

  swapMethods.push(
    SwapRouter.swapCallParameters(trade, {
      feeOnTransfer: false,
      recipient,
      slippageTolerance: allowedSlippage,
      deadline: deadline.toString(),
    }),
  )

  if (trade.tradeType === TradeType.EXACT_INPUT) {
    swapMethods.push(
      SwapRouter.swapCallParameters(trade, {
        feeOnTransfer: true,
        recipient,
        slippageTolerance: allowedSlippage,
        deadline: deadline.toString(),
      }),
    )
  }

  return swapMethods.map(({ calldata, value }) => ({
    address: swapRouterAddress,
    calldata,
    value,
  }))
}

/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This object seems to be undocumented by ethers.
 * @param error an error from the ethers provider
 */
function swapErrorToUserReadableMessage(error) {
  let reason
  while (error) {
    reason = error.reason ?? error.message ?? reason
    error = error.error ?? error.data?.originalError
  }

  if (reason?.indexOf('execution reverted: ') === 0) reason = reason.substr('execution reverted: '.length)

  switch (reason) {
    case 'UniswapV2Router: EXPIRED':
      return 'The transaction could not be sent because the deadline has passed. Please check that your transaction deadline is not too low.'
    case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
    case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
      return 'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.'
    case 'TransferHelper: TRANSFER_FROM_FAILED':
      return 'The input token cannot be transferred. There may be an issue with the input token.'
    case 'UniswapV2: TRANSFER_FAILED':
      return 'The output token cannot be transferred. There may be an issue with the output token.'
    case 'UniswapV2: K':
      return 'THENA invariant x*y=k was not satisfied by the swap. This usually means one of the tokens you are swapping incorporates custom behavior on transfer.'
    case 'Too little received':
    case 'Too much requested':
    case 'STF':
      return 'This transaction will not succeed due to price movement. Try increasing your slippage tolerance. Note: rebase tokens are incompatible with THENA'
    case 'TF':
      return 'The output token cannot be transferred. There may be an issue with the output token. Note: rebase tokens are incompatible with THENA.'
    default:
      if (reason?.indexOf('undefined is not an object') !== -1) {
        console.error(error, reason)
        return 'An error occurred when trying to execute this swap. You may need to increase your slippage tolerance. If that does not work, there may be an incompatibility with the token you are trading. Note: rebase tokens are incompatible with Algebra.'
      }
      return `Unknown error${
        reason ? `: "${reason}"` : ''
      }. Try increasing your slippage tolerance. Note: rebase tokens are incompatible with THENA.`
  }
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade, // trade to execute, required
  allowedSlippage, // in bips
  deadline,
) {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const timestamp = Math.floor(new Date().getTime() / 1000) + deadline * 60
  const swapCalls = useSwapCallArguments(trade, allowedSlippage, account, timestamp, chainId)
  const { startTxn, endTxn, writeTxn, sendTxn } = useTxn()
  const publicClient = usePublicClient()

  const onFusionSwap = useCallback(
    async callback => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const swapuuid = uuidv4()
      const inputCurrency = trade.inputAmount.currency
      const outputCurrency = trade.outputAmount.currency
      const inputSymbol = inputCurrency.symbol
      const outputSymbol = outputCurrency.symbol
      const inputAmount = trade.inputAmount.toSignificant(4)
      const outputAmount = trade.outputAmount.toSignificant(4)
      setPending(true)

      let isApproved = true
      const fusionRouterAddress = Contracts.fusionRouter[chainId]
      if (!inputCurrency.isNative) {
        const inputTokenContract = getERC20Contract(inputCurrency.address, chainId)
        const allowance = await readCall(inputTokenContract, 'allowance', [account, fusionRouterAddress], chainId)
        isApproved = fromWei(allowance, inputCurrency.decimals).gte(trade.inputAmount.toExact())
      }
      startTxn({
        key,
        title: `Swap ${inputSymbol} for ${outputSymbol}`,
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: `Approve ${inputSymbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [swapuuid]: {
            desc: `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      if (!isApproved) {
        const inputTokenContract = getERC20Contract(inputCurrency.address, chainId)
        if (!(await writeTxn(key, approveuuid, inputTokenContract, 'approve', [fusionRouterAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }
      const estimatedCalls = await Promise.all(
        swapCalls.map(call => {
          const { address, calldata, value } = call

          const tx =
            !value || isZero(value)
              ? { account, to: address, data: calldata }
              : {
                  account,
                  to: address,
                  data: calldata,
                  value,
                }

          return publicClient
            .estimateGas(tx)
            .then(gasEstimate => ({
              call,
              gasEstimate,
            }))
            .catch(gasError => {
              console.debug('Gas estimate failed, trying eth_call to extract error', call)

              return publicClient
                .call(tx)
                .then(result => {
                  console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
                  return {
                    call,
                    error: new Error('Unexpected issue with estimating the gas. Please try again.'),
                  }
                })
                .catch(callError => {
                  console.debug('Call threw error', call, callError)
                  return {
                    call,
                    error: new Error(swapErrorToUserReadableMessage(callError)),
                  }
                })
            })
        }),
      )

      // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
      let bestCallOption = estimatedCalls.find(
        (el, ix, list) => 'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1]),
      )

      // check if any calls errored with a recognizable error
      if (!bestCallOption) {
        const errorCalls = estimatedCalls.filter(call => 'error' in call)
        if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
        const firstNoErrorCall = estimatedCalls.find(call => !('error' in call))
        if (!firstNoErrorCall) throw new Error('Unexpected error. Could not estimate gas for the swap.')
        bestCallOption = firstNoErrorCall
      }
      const {
        call: { calldata, value },
      } = bestCallOption

      if (!(await sendTxn(key, swapuuid, fusionRouterAddress, calldata, value))) {
        setPending(false)
        return
      }

      setPending(false)

      endTxn({
        key,
        final: 'Swap Successful',
      })
      callback()
    },
    [trade, publicClient, account, swapCalls, chainId, startTxn, endTxn, writeTxn, sendTxn],
  )

  return { pending, callback: onFusionSwap }
}
