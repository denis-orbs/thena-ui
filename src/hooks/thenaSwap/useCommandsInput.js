/* global BigInt */
import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { encodeAbiParameters, encodePacked, parseAbiParameters, zeroAddress } from 'viem'

import { PROTOCOL, SWAP_COMMANDS, TRADE_TYPE } from '@/constant/thenaSwap'
import { useSettings } from '@/state/settings/hooks'
import { toWeiRound } from '@/utils/utils'

import { feeOnTransferTokens } from './feeOnTransferTokens'
import useWallet from '../useWallet'

function packAddresses(addresses, insertZero = false) {
  const fullAddresses = []
  for (let i = 0; i < addresses.length; i++) {
    fullAddresses.push(addresses[i])
    if (insertZero && i < addresses.length - 1) {
      fullAddresses.push(zeroAddress)
    }
  }

  const abiTypes = Array(fullAddresses.length).fill('address')
  return encodePacked(abiTypes, fullAddresses)
}

const encIntegralExactInput = ({ path, recipient, deadline, amountIn, amountOutMinimum }, insertZero = false) =>
  encodeAbiParameters(
    parseAbiParameters('(bytes path,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum)'),
    [
      {
        path: packAddresses(path, insertZero),
        recipient,
        deadline: BigInt(deadline),
        amountIn,
        amountOutMinimum,
      },
    ],
  )

/** abi.encode(uint256 amountIn, uint256 amountOutMin, bytes[] routes, address to, uint256 deadline) */
export function encSolidlySwapParams({ amountIn, amountOutMin, routes, to, deadline }) {
  const tupleRoutes = routes.map(r => [r.from, r.to, !!r.stable]) // <<-- tuple []
  const paramsBytes = encodeAbiParameters(
    parseAbiParameters(
      '(uint256 amountIn,uint256 amountOutMin,(address from,address to,bool stable)[] routes,address to,uint256 deadline)',
    ),
    [
      {
        amountIn,
        amountOutMin,
        routes: tupleRoutes, // [{ from, to, stable }]
        to,
        deadline,
      },
    ],
  )

  return paramsBytes
}

/* safer command resolver: Solidly doesn't "exact out" here */
const getCommands = (protocol, tradeType = TRADE_TYPE.EXACT_INPUT) => {
  if (protocol === PROTOCOL.SOLIDLY) {
    return tradeType === TRADE_TYPE.EXACT_INPUT
      ? SWAP_COMMANDS.SLD_EXACT_TOKENS_TOKENS
      : SWAP_COMMANDS.SLD_EXACT_TOKENS_TOKENS_FEE // fee-on-transfer variant, not true exact-out
  }

  if (protocol === PROTOCOL.FUSION) {
    return tradeType === TRADE_TYPE.EXACT_INPUT ? SWAP_COMMANDS.FUSION_EXACT_INPUT : SWAP_COMMANDS.FUSION_EXACT_OUTPUT
  }

  if (protocol === PROTOCOL.INTEGRAL) {
    return tradeType === TRADE_TYPE.EXACT_INPUT
      ? SWAP_COMMANDS.INTEGRAL_EXACT_INPUT
      : SWAP_COMMANDS.INTEGRAL_EXACT_OUTPUT
  }

  return null
}

const useCommandsInput = ({
  route,
  isNativeTokenInput,
  tokenIn,
  tokenOut,
  tradeType = TRADE_TYPE.EXACT_INPUT,
  amountIn,
  userAddress,
  routerAddress,
  deadline,
  isJustWrap = false,
  isJustUnwrap = false,
}) => {
  const { account } = useWallet()
  const { slippage } = useSettings()

  return useMemo(() => {
    const amountInWei = toWeiRound(amountIn ?? '0', tokenIn?.decimals)
    const commands = []
    const inputs = []
    // check if wrapped native to wrapped or unwrap
    if (isJustWrap) {
      commands.push(SWAP_COMMANDS.NATIVE_TO_WRAPPED)
      inputs.push(encodeAbiParameters(['uint256'], [amountInWei]))
      return { commands, inputs }
    }
    if (isJustUnwrap) {
      commands.push(SWAP_COMMANDS.WRAPPED_TO_NATIVE)
      inputs.push(encodeAbiParameters(['uint256'], [amountInWei]))
      return { commands, inputs }
    }

    if (!route || route.length === 0) {
      return {
        commands: [],
        inputs: [],
      }
    }

    // 1) Transfer or wrap input
    if (isNativeTokenInput) {
      commands.push(SWAP_COMMANDS.NATIVE_TO_WRAPPED)
      inputs.push(encodeAbiParameters(parseAbiParameters('uint256, address'), [amountInWei, routerAddress]))
    } else {
      commands.push(SWAP_COMMANDS.TRANSFER_TOKEN_FROM_MSGSENDER)
      inputs.push(
        encodeAbiParameters(parseAbiParameters('address token, uint256 amount'), [tokenIn.address, amountInWei]),
      )
    }

    route.forEach(hop => {
      const recipient = tokenOut?.symbol === 'BNB' ? routerAddress : userAddress
      const cmd = getCommands(hop.protocol, tradeType, feeOnTransferTokens.includes(tokenIn?.address?.toLowerCase()))
      const _amountIn = toWeiRound(BigNumber(amountIn).times(hop.percent).div(100).toString(), tokenIn?.decimals)
      // Calculate amountOutMin with slippage: amountOut * (1 - slippage / 100)
      const _amountOutMin = toWeiRound(
        BigNumber(hop.quote)
          .times(100 - slippage)
          .div(100)
          .toString(),
        tokenOut?.decimals || 18,
      )
      const routes = []

      if (hop.protocol === PROTOCOL.SOLIDLY) {
        const pairs = hop.route?.pairs || []
        const path = hop.route?.path || []
        if (pairs.length > 0 && path.length > 0) {
          for (let i = 0; i < path.length - 1; i++) {
            const from = path[i].address
            const to = path[i + 1].address
            const stable = Boolean(pairs[i]?.stable)
            routes.push({
              from,
              to,
              stable,
            })
          }
        }
        inputs.push(
          encSolidlySwapParams({
            amountIn: _amountIn,
            amountOutMin: _amountOutMin,
            routes,
            to: recipient,
            deadline,
          }),
        )
      } else {
        const path = (hop.route?.tokenPath || []).map(tk => tk.address)
        inputs.push(
          encIntegralExactInput(
            {
              path,
              recipient,
              deadline,
              amountIn: _amountIn,
              amountOutMinimum: _amountOutMin,
            },
            hop.protocol === PROTOCOL.INTEGRAL,
          ),
        )
      }
      commands.push(cmd)

      // unwrap
      if (tokenOut?.symbol === 'BNB') {
        commands.push(SWAP_COMMANDS.WRAPPED_TO_NATIVE)
        inputs.push(
          encodeAbiParameters(parseAbiParameters('uint256, address'), [
            toWeiRound(BigNumber(hop.quote), tokenOut?.decimals),
            account,
          ]),
        )
      }
    })

    return { commands, inputs }
  }, [
    account,
    amountIn,
    tokenIn?.decimals,
    tokenIn?.address,
    isJustWrap,
    isJustUnwrap,
    route,
    isNativeTokenInput,
    userAddress,
    routerAddress,
    tradeType,
    deadline,
    slippage,
    tokenOut?.symbol,
    tokenOut?.decimals,
  ])
}

export default useCommandsInput
