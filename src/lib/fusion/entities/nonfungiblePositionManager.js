import { CurrencyAmount, JSBI, validateAndParseAddress } from 'thena-sdk-core'
import { ADDRESS_ZERO, Position, toHex } from 'thenafi-fusion-sdk'
import invariant from 'tiny-invariant'
import { decodeEventLog, encodeFunctionData, getAddress, keccak256, zeroAddress } from 'viem'

import { ZERO_ADDRESS } from '@/constant'
import { NPMFusionABI } from '@/constant/abi/NPMFusionABI'
import { NPMIntegralABI } from '@/constant/abi/NPMIntegralABI'
import Contracts from '@/constant/contracts'

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

  static getCalldata(func, args, version = 2) {
    return encodeFunctionData({
      abi: version === 2 ? NPMFusionABI : NPMIntegralABI,
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

  static getMintedPosition(addTxRecieve, chainId) {
    const NPMIntegralContract = {
      address: Contracts.NPMIntegral[chainId],
      abi: NPMIntegralABI,
    }
    const functionSignature = 'IncreaseLiquidity(uint256,uint128,uint128,uint256,uint256,address)'
    const targetTopic = keccak256(new TextEncoder().encode(functionSignature))

    const mintedEvent = addTxRecieve.logs?.find(
      e => getAddress(e.address) === getAddress(NPMIntegralContract.address) && e.topics[0] === targetTopic,
    )

    return decodeEventLog({
      abi: NPMIntegralContract.abi,
      data: mintedEvent.data,
      topics: mintedEvent.topics,
    })
  }

  static addCallParameters(position, options) {
    invariant(JSBI.greaterThan(position.liquidity, ZERO), 'ZERO_LIQUIDITY')

    const calldatas = []
    const { version = 3 } = options

    // get amounts
    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts

    // adjust for slippage
    const minimumAmounts = position.mintAmountsWithSlippage(options.slippageTolerance)
    const amount0Min = toHex(minimumAmounts.amount0)
    const amount1Min = toHex(minimumAmounts.amount1)

    const deadline = toHex(options.deadline)

    // create pool if needed
    if (isMint(options) && options.createPool) {
      calldatas.push(this.encodeCreate(position.pool, version))
    }

    // permits if necessary
    if (options.token0Permit) {
      calldatas.push(NonfungiblePositionManager.encodePermit(position.pool.token0, options.token0Permit))
    }
    if (options.token1Permit) {
      calldatas.push(NonfungiblePositionManager.encodePermit(position.pool.token1, options.token1Permit))
    }

    // MARK: CREATE NEW POSITION OR INCREASE OLD POSITION
    if (isMint(options)) {
      const recipient = validateAndParseAddress(options.recipient)

      const baseParams = {
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
      }

      let paramMin = baseParams
      if (version === 2) {
        paramMin = baseParams
      } else if (options.isFarming) {
        paramMin = { ...baseParams, deployer: zeroAddress }
      } else {
        paramMin = { ...baseParams, deployer: Contracts.pluginFactory[options.chainId] }
      }

      calldatas.push(NonfungiblePositionManager.getCalldata('mint', [paramMin], version))
    } else {
      // increase
      calldatas.push(
        NonfungiblePositionManager.getCalldata(
          'increaseLiquidity',
          [
            {
              tokenId: toHex(options.tokenId),
              amount0Desired: toHex(amount0Desired),
              amount1Desired: toHex(amount1Desired),
              amount0Min,
              amount1Min,
              deadline,
            },
          ],
          version,
        ),
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
        // remove 100% liquidity + isBurnToken = true
        calldatas.push(NonfungiblePositionManager.getCalldata('burn', [tokenId]))
      }
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

  static encodeCreate(pool, version = 2) {
    const param =
      version === 2
        ? [pool.token0.address, pool.token1.address, toHex(pool.sqrtRatioX96)]
        : [pool.token0.address, pool.token1.address, ZERO_ADDRESS, toHex(pool.sqrtRatioX96), '']

    return NonfungiblePositionManager.getCalldata('createAndInitializePoolIfNecessary', param, version)
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
