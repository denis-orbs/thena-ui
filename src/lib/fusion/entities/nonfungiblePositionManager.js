import { ADDRESS_ZERO, Position, toHex } from 'thena-fusion-sdk'
import { CurrencyAmount, JSBI, validateAndParseAddress } from 'thena-sdk-core'
import invariant from 'tiny-invariant'
import { encodeFunctionData } from 'viem'

import { algebraAbi } from '@/constant/abi/fusion'

import { SelfPermit } from './selfPermit'

const ZERO = JSBI.BigInt(0)
const ONE = JSBI.BigInt(1)

const MaxUint128 = toHex(JSBI.subtract(JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)), JSBI.BigInt(1)))

// type guard
function isMint(options) {
  return Object.keys(options).some(k => k === 'recipient')
}

export class NonfungiblePositionManager extends SelfPermit {
  constructor() {
    super()
    if (this.constructor === NonfungiblePositionManager) {
      throw new Error("Abstract classes can't be instantiated.")
    }
  }

  static getCalldata(func, args) {
    return encodeFunctionData({
      abi: algebraAbi,
      functionName: func,
      args,
    })
  }

  static createCallParameters(pool) {
    return {
      calldata: this.encodeCreate(pool),
      value: toHex(0),
    }
  }

  static addCallParameters(position, options) {
    invariant(JSBI.greaterThan(position.liquidity, ZERO), 'ZERO_LIQUIDITY')

    const calldatas = []

    // get amounts
    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts

    // adjust for slippage
    const minimumAmounts = position.mintAmountsWithSlippage(options.slippageTolerance)
    const amount0Min = toHex(minimumAmounts.amount0)
    const amount1Min = toHex(minimumAmounts.amount1)

    const deadline = toHex(options.deadline)

    // create pool if needed
    if (isMint(options) && options.createPool) {
      calldatas.push(this.encodeCreate(position.pool))
    }

    // permits if necessary
    if (options.token0Permit) {
      calldatas.push(NonfungiblePositionManager.encodePermit(position.pool.token0, options.token0Permit))
    }
    if (options.token1Permit) {
      calldatas.push(NonfungiblePositionManager.encodePermit(position.pool.token1, options.token1Permit))
    }

    // mint
    if (isMint(options)) {
      const recipient = validateAndParseAddress(options.recipient)

      calldatas.push(
        NonfungiblePositionManager.getCalldata('mint', [
          {
            token0: position.pool.token0.address,
            token1: position.pool.token1.address,
            tickLower: position.tickLower,
            tickUpper: position.tickUpper,
            amount0Desired: toHex(amount0Desired),
            amount1Desired: toHex(amount1Desired),
            amount0Min,
            amount1Min,
            recipient,
            deadline,
          },
        ]),
      )
    } else {
      // increase
      calldatas.push(
        NonfungiblePositionManager.getCalldata('increaseLiquidity', [
          {
            tokenId: toHex(options.tokenId),
            amount0Desired: toHex(amount0Desired),
            amount1Desired: toHex(amount1Desired),
            amount0Min,
            amount1Min,
            deadline,
          },
        ]),
      )
    }

    let value = toHex(0)

    if (options.useNative) {
      const { wrapped } = options.useNative
      invariant(position.pool.token0.equals(wrapped) || position.pool.token1.equals(wrapped), 'NO_WNative')

      const wrappedValue = position.pool.token0.equals(wrapped) ? amount0Desired : amount1Desired

      // we only need to refund if we're actually sending ETH
      if (JSBI.greaterThan(wrappedValue, ZERO)) {
        calldatas.push(NonfungiblePositionManager.getCalldata('refundNativeToken'))
      }

      value = toHex(wrappedValue)
    }

    return {
      calldata:
        calldatas.length === 1 ? calldatas[0] : NonfungiblePositionManager.getCalldata('multicall', [calldatas]),
      value,
    }
  }

  static collectCallParameters(options) {
    const calldatas = NonfungiblePositionManager.encodeCollect(options)

    return {
      calldata:
        calldatas.length === 1 ? calldatas[0] : NonfungiblePositionManager.getCalldata('multicall', [calldatas]),
      value: toHex(0),
    }
  }

  /**
   * Produces the calldata for completely or partially exiting a position
   * @param position The position to exit
   * @param options Additional information necessary for generating the calldata
   * @returns The call parameters
   */
  static removeCallParameters(position, options) {
    const calldatas = []

    const deadline = toHex(options.deadline)
    const tokenId = toHex(options.tokenId)

    // construct a partial position with a percentage of liquidity
    const partialPosition = new Position({
      pool: position.pool,
      liquidity: options.liquidityPercentage.multiply(position.liquidity).quotient,
      tickLower: position.tickLower,
      tickUpper: position.tickUpper,
    })
    invariant(JSBI.greaterThan(partialPosition.liquidity, ZERO), 'ZERO_LIQUIDITY')

    // slippage-adjusted underlying amounts
    const { amount0: amount0Min, amount1: amount1Min } = partialPosition.burnAmountsWithSlippage(
      options.slippageTolerance,
    )

    if (options.permit) {
      calldatas.push(
        NonfungiblePositionManager.getCalldata('permit', [
          validateAndParseAddress(options.permit.spender),
          tokenId,
          toHex(options.permit.deadline),
          options.permit.v,
          options.permit.r,
          options.permit.s,
        ]),
      )
    }

    // remove liquidity
    calldatas.push(
      NonfungiblePositionManager.getCalldata('decreaseLiquidity', [
        {
          tokenId,
          liquidity: toHex(partialPosition.liquidity),
          amount0Min: toHex(amount0Min),
          amount1Min: toHex(amount1Min),
          deadline,
        },
      ]),
    )

    const { expectedCurrencyOwed0, expectedCurrencyOwed1, ...rest } = options.collectOptions
    if (expectedCurrencyOwed0 && expectedCurrencyOwed1) {
      calldatas.push(
        ...NonfungiblePositionManager.encodeCollect({
          tokenId: options.tokenId,
          // add the underlying value to the expected currency already owed
          expectedCurrencyOwed0: expectedCurrencyOwed0.add(
            CurrencyAmount.fromRawAmount(expectedCurrencyOwed0.currency, amount0Min),
          ),
          expectedCurrencyOwed1: expectedCurrencyOwed1.add(
            CurrencyAmount.fromRawAmount(expectedCurrencyOwed1.currency, amount1Min),
          ),
          ...rest,
        }),
      )
    }

    if (options.liquidityPercentage.equalTo(ONE)) {
      if (options.burnToken) {
        calldatas.push(NonfungiblePositionManager.getCalldata('burn', [tokenId]))
      }
    } else {
      invariant(options.burnToken !== true, 'CANNOT_BURN')
    }

    return {
      calldata: NonfungiblePositionManager.getCalldata('multicall', [calldatas]),
      value: toHex(0),
    }
  }

  static burnCallParameters(id) {
    const tokenId = toHex(id)

    return {
      calldata: NonfungiblePositionManager.getCalldata('burn', [tokenId]),
      value: toHex(0),
    }
  }

  static encodeCreate(pool) {
    return NonfungiblePositionManager.getCalldata('createAndInitializePoolIfNecessary', [
      pool.token0.address,
      pool.token1.address,
      toHex(pool.sqrtRatioX96),
    ])
  }

  static encodeCollect(options) {
    const calldatas = []

    const tokenId = toHex(options.tokenId)

    const involvesETH =
      options.expectedCurrencyOwed0.currency.isNative || options.expectedCurrencyOwed1.currency.isNative

    const recipient = validateAndParseAddress(options.recipient)

    // collect
    calldatas.push(
      NonfungiblePositionManager.getCalldata('collect', [
        {
          tokenId,
          recipient: involvesETH ? ADDRESS_ZERO : recipient,
          amount0Max: MaxUint128,
          amount1Max: MaxUint128,
        },
      ]),
    )

    if (involvesETH) {
      const ethAmount = options.expectedCurrencyOwed0.currency.isNative
        ? options.expectedCurrencyOwed0.quotient
        : options.expectedCurrencyOwed1.quotient
      const token = options.expectedCurrencyOwed0.currency.isNative
        ? options.expectedCurrencyOwed1.currency
        : options.expectedCurrencyOwed0.currency
      const tokenAmount = options.expectedCurrencyOwed0.currency.isNative
        ? options.expectedCurrencyOwed1.quotient
        : options.expectedCurrencyOwed0.quotient

      calldatas.push(NonfungiblePositionManager.getCalldata('unwrapWNativeToken', [toHex(ethAmount), recipient]))
      calldatas.push(
        NonfungiblePositionManager.getCalldata('sweepToken', [token.address, toHex(tokenAmount), recipient]),
      )
    }

    return calldatas
  }
}
