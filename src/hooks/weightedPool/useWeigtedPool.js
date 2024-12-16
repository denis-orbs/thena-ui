import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { v4 as uuidv4 } from 'uuid'
import { encodePacked, maxUint256, parseEventLogs, toHex } from 'viem'

import { TXN_STATUS } from '@/constant'
import { weightedPoolFactoryAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import { useMutateAssets } from '@/context/assetsContext'
import { readCall, waitCall } from '@/lib/contractActions'
import {
  getERC20Contract,
  getWeightedPoolContract,
  getWeightedPoolFactoryContract,
  getWeightedPoolRouterContract,
  getWeightedPoolRouterSimulatorContract,
  getWeightedPoolVaultContract,
} from '@/lib/contracts'
import { fromWei, roundIfMoreThanDecimals, toWei } from '@/lib/utils'
import { useTxn } from '@/state/transactions/hooks'

import useWallet from '../useWallet'

const toBytes32 = hexString => {
  const rawBytes = Uint8Array.from(Buffer.from(hexString.slice(2), 'hex'))

  if (rawBytes.length > 32) {
    return rawBytes.slice(0, 32)
  }
  const finalBytes = new Uint8Array(32)
  finalBytes.set(rawBytes)
  return finalBytes
}

export const useWeightPoolData = poolAddress => {
  const { account, chainId } = useWallet()
  const weightedPoolContract = useMemo(() => getWeightedPoolContract(poolAddress, chainId), [poolAddress, chainId])

  const getBalanceAndDecimals = useCallback(async () => {
    try {
      const balance = await readCall(weightedPoolContract, 'balanceOf', [account], chainId)
      const decimals = await readCall(weightedPoolContract, 'decimals', [], chainId)

      return { balance: fromWei(balance), decimals }
    } catch (error) {
      console.error('Failed to fetch balance or decimals:', error)
    }
  }, [account, chainId, weightedPoolContract])

  const {
    data,
    mutate: mutatePoolBalance,
    isLoading,
  } = useSWR(
    poolAddress && account && chainId && ['get balance pool', account?.toLowerCase()],
    () => getBalanceAndDecimals(),
    {
      refreshInterval: 0,
    },
  )

  if (!poolAddress) {
    return {
      balance: new BigNumber(0),
      decimals: new BigNumber(18),
      pending: false,
      mutatePoolBalance,
    }
  }

  return {
    balance: data?.balance ?? new BigNumber(0),
    decimals: data?.decimals ?? 18,
    pending: isLoading,
    mutatePoolBalance,
  }
}

export const useWeightedPool = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()
  const mutateAssets = useMutateAssets()

  const poolFactoryContract = useMemo(() => getWeightedPoolFactoryContract(chainId), [chainId])
  const routerContract = useMemo(() => getWeightedPoolRouterContract(chainId), [chainId])
  const routerSimulatorContract = useMemo(() => getWeightedPoolRouterSimulatorContract(chainId), [chainId])
  const vaultContract = useMemo(() => getWeightedPoolVaultContract(chainId), [chainId])

  const handleGetPoolId = useCallback(async txHash => {
    const txnReceipt = await waitCall(txHash)
    const eventLogs = parseEventLogs({
      abi: weightedPoolFactoryAbi,
      eventName: 'PoolCreated',
      logs: txnReceipt.logs,
    })

    if (eventLogs && eventLogs.length > 0) {
      const parsed = eventLogs[0]
      if (parsed.args) {
        return parsed.args.pool
      }
    }

    return ''
  }, [])

  const onCreateWeightedPool = useCallback(
    async (name, symbol, tokens, allocates, amounts, fee, onSuccess) => {
      const key = uuidv4()
      const createuuid = uuidv4()
      const initialLiquidityuuid = uuidv4()
      const registerPooluuid = uuidv4()

      const transactions = {}

      setPending(true)

      for (const tokenItem of tokens) {
        const tokenContract = getERC20Contract(tokenItem.address, chainId)
        const approveFeeuuid = uuidv4()
        const allowance = await readCall(
          tokenContract,
          'allowance',
          [account, Contracts.weightedPoolRouter[chainId]],
          chainId,
        )

        const isApprovedFee = fromWei(allowance, tokenItem.decimals).gte(tokenItem.amount)

        if (!isApprovedFee) {
          tokenItem.id = approveFeeuuid
          transactions[approveFeeuuid] = {
            desc: `${t('Approve')} ${tokenItem.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }
      }

      transactions[createuuid] = {
        desc: t('Create New Weighted Pool'),
        status: TXN_STATUS.START,
        hash: null,
      }
      transactions[registerPooluuid] = {
        desc: t('Register Pool'),
        status: TXN_STATUS.START,
        hash: null,
      }
      transactions[initialLiquidityuuid] = {
        desc: t('Add initial liquidity'),
        status: TXN_STATUS.START,
        hash: null,
      }

      startTxn({
        key,
        title: t('Create Weighted Pool'),
        transactions,
      })

      for (const tokenItem of tokens) {
        if (tokenItem.id) {
          const tokenContract = getERC20Contract(tokenItem.address, chainId)
          const isSuccess = await writeTxn(key, tokenItem.id, tokenContract, 'approve', [
            Contracts.weightedPoolRouter[chainId],
            maxUint256,
          ])

          if (!isSuccess) {
            setPending(false)
            return false
          }
        }
      }

      // Convert to hex
      const encodeName = encodePacked(['string'], [name])
      const salt = toHex(toBytes32(encodeName))

      const tokenIds = tokens.map(token => token.address)

      const txHash = await writeTxn(key, createuuid, poolFactoryContract, 'create', [
        name,
        symbol,
        tokenIds,
        allocates,
        account.toLowerCase(),
        salt,
      ])

      if (!txHash) {
        setPending(false)
        return false
      }

      const poolId = await handleGetPoolId(txHash)
      const weightedPoolContract = getWeightedPoolContract(poolId, chainId)
      const poolId32 = await readCall(weightedPoolContract, 'getPoolId', [], chainId)
      await writeTxn(key, registerPooluuid, routerContract, 'registerPool', [poolId32, fee * 100])
      const result = await writeTxn(key, initialLiquidityuuid, routerContract, 'joinPoolInit', [
        poolId32,
        tokenIds,
        amounts,
      ])

      if (!result) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Create Weighted Pool Successful',
      })
      setPending(false)
      mutateAssets()
      if (onSuccess) {
        onSuccess(poolId)
      }
    },
    [
      t,
      startTxn,
      writeTxn,
      poolFactoryContract,
      account,
      handleGetPoolId,
      chainId,
      routerContract,
      endTxn,
      mutateAssets,
    ],
  )

  const onAddLiquiditySingleToken = useCallback(
    async (poolId32, token, amountDeposit, minBPTAmountOut, onSuccess) => {
      setPending(true)
      const tokenContract = getERC20Contract(token.address, chainId)

      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const joinPooluuid = uuidv4()

      const allowance = await readCall(
        tokenContract,
        'allowance',
        [account, Contracts.weightedPoolRouter[chainId]],
        chainId,
      )

      const isApprovedFee = fromWei(allowance, token.decimals).gte(amountDeposit)

      startTxn({
        key,
        title: t('Add Liquidity'),
        transactions: {
          ...(isApprovedFee
            ? {}
            : {
                [approveFeeuuid]: {
                  desc: `${t('Approve')} ${token.symbol}`,
                  status: TXN_STATUS.START,
                  hash: null,
                },
              }),
          [joinPooluuid]: {
            desc: t('Add Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (!isApprovedFee) {
        const isSuccess = await writeTxn(key, approveFeeuuid, tokenContract, 'approve', [
          Contracts.weightedPoolRouter[chainId],
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())
      const idx = tokensToLowerCase?.indexOf(token?.address?.toLowerCase())
      const amountIn = Math.floor(toWei(amountDeposit, token.decimals))
      const slippage = 0.5 // TODO: Get slippage from UI
      const minAmountOut = Math.floor(
        toWei(minBPTAmountOut)
          .times((100 - slippage) / 100)
          .toNumber(),
      )

      const result = await writeTxn(key, joinPooluuid, routerContract, 'joinPool', [
        poolId32,
        idx,
        amountIn,
        minAmountOut,
      ])

      if (!result) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Liquidity Add Successful',
      })

      setPending(false)

      if (typeof onSuccess === 'function') {
        onSuccess()
      }
      mutateAssets()
      return result
    },
    [account, chainId, endTxn, mutateAssets, routerContract, startTxn, t, vaultContract, writeTxn],
  )

  const onAddLiquidityAllToken = useCallback(
    async (poolId32, tokensData, minBPTAmountOut, onSuccess) => {
      const key = uuidv4()
      const addLiquidityuuid = uuidv4()

      const transactions = {}
      setPending(true)

      for (const tokenItem of tokensData) {
        const tokenContract = getERC20Contract(tokenItem.address, chainId)
        const approveFeeuuid = uuidv4()

        const allowance = await readCall(
          tokenContract,
          'allowance',
          [account, Contracts.weightedPoolRouter[chainId]],
          chainId,
        )
        const isApprovedFee = fromWei(allowance, tokenItem.decimals).gte(tokenItem.amountDeposit)

        if (!isApprovedFee) {
          tokenItem.id = approveFeeuuid
          transactions[approveFeeuuid] = {
            desc: `${t('Approve')} ${tokenItem.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }
      }

      transactions[addLiquidityuuid] = {
        desc: t('Add Liquidity'),
        status: TXN_STATUS.START,
        hash: null,
      }

      startTxn({
        key,
        title: t('Add Liquidity'),
        transactions,
      })

      for (const tokenItem of tokensData) {
        if (tokenItem.id) {
          const tokenContract = getERC20Contract(tokenItem.address, chainId)
          const isSuccess = await writeTxn(key, tokenItem.id, tokenContract, 'approve', [
            Contracts.weightedPoolRouter[chainId],
            maxUint256,
          ])

          if (!isSuccess) {
            setPending(false)
            return false
          }
        }
      }

      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())

      const sortedAsset = tokensData.sort((a, b) => {
        const indexA = tokensToLowerCase.indexOf(a.address)
        const indexB = tokensToLowerCase.indexOf(b.address)

        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })

      const assetsAddress = tokensData.map(asset => asset.address)
      const maxAmountsIn = sortedAsset.map(asset => toWei(asset.amountDeposit, asset.decimals))
      const slippage = 0.5 // TODO: Get slippage from UI
      const minAmountOut = Math.floor(
        toWei(minBPTAmountOut)
          .times((100 - slippage) / 100)
          .toNumber(),
      )

      const result = await writeTxn(key, addLiquidityuuid, routerContract, 'joinPoolAllTokens', [
        poolId32,
        assetsAddress,
        maxAmountsIn,
        minAmountOut,
      ])

      if (!result) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Liquidity Add Successful',
      })

      setPending(false)

      if (typeof onSuccess === 'function') {
        onSuccess()
      }
      mutateAssets()
      return result
    },
    [account, chainId, endTxn, mutateAssets, routerContract, startTxn, t, vaultContract, writeTxn],
  )

  const onRemoveLiquiditySingleToken = useCallback(
    async (pool, outToken, amount, minAmountOut, onSuccess) => {
      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const removeLiquidityuuid = uuidv4()

      const { poolId: poolId32, address: poolAddress } = pool

      const weightedPoolContract = getWeightedPoolContract(poolAddress, chainId)

      const lpTokenDecimals = await readCall(weightedPoolContract, 'decimals', [], chainId)
      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())
      const outputTokenIndex = tokensToLowerCase?.indexOf(outToken?.address?.toLowerCase())

      const lpTokenContract = getERC20Contract(poolAddress, chainId)
      const allowance = await readCall(
        lpTokenContract,
        'allowance',
        [account, Contracts.weightedPoolRouter[chainId]],
        chainId,
      )
      const isApprovedFee = fromWei(allowance, lpTokenDecimals).gte(amount)

      startTxn({
        key,
        title: t('Remove Liquidity'),
        transactions: {
          ...(isApprovedFee
            ? {}
            : {
                [approveFeeuuid]: {
                  desc: `${t('Approve')} ${pool.symbol}`,
                  status: TXN_STATUS.START,
                  hash: null,
                },
              }),
          [removeLiquidityuuid]: {
            desc: t('Remove Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (!isApprovedFee) {
        const isSuccess = await writeTxn(key, approveFeeuuid, lpTokenContract, 'approve', [
          Contracts.weightedPoolRouter[chainId],
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const slippage = 0.5 // TODO: Slippage get from UI
      const minAmountOutWithSlippage = Math.floor(
        toWei(minAmountOut, outToken?.decimals || 18)
          .times((100 - slippage) / 100)
          .toNumber(),
      )

      const result = await writeTxn(key, removeLiquidityuuid, routerContract, 'exitPool', [
        poolId32,
        amount,
        outputTokenIndex,
        minAmountOutWithSlippage,
      ])

      if (!result) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Liquidity Remove Successful',
      })

      setPending(false)

      if (typeof onSuccess === 'function') {
        onSuccess()
      }
      mutateAssets()
      return result
    },
    [account, chainId, endTxn, mutateAssets, routerContract, startTxn, t, vaultContract, writeTxn],
  )

  const onRemoveLiquidityAllToken = useCallback(
    async (pool, amount, minAmountsOut, tokensData, onSuccess) => {
      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const removeLiquidityuuid = uuidv4()

      const { poolId: poolId32, address: poolAddress } = pool

      const weightedPoolContract = getWeightedPoolContract(poolAddress, chainId)
      const lpTokenDecimals = await readCall(weightedPoolContract, 'decimals', [], chainId)
      const lpTokenContract = getERC20Contract(poolAddress, chainId)

      const allowance = await readCall(
        lpTokenContract,
        'allowance',
        [account, Contracts.weightedPoolRouter[chainId]],
        chainId,
      )
      const isApprovedFee = fromWei(allowance, lpTokenDecimals).gte(amount)

      startTxn({
        key,
        title: t('Remove Liquidity'),
        transactions: {
          ...(isApprovedFee
            ? {}
            : {
                [approveFeeuuid]: {
                  desc: `${t('Approve')} ${pool.symbol}`,
                  status: TXN_STATUS.START,
                  hash: null,
                },
              }),
          [removeLiquidityuuid]: {
            desc: t('Remove Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (!isApprovedFee) {
        const isSuccess = await writeTxn(key, approveFeeuuid, lpTokenContract, 'approve', [
          Contracts.weightedPoolRouter[chainId],
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const minAmountsOutToWei = minAmountsOut.map((value, idx) => {
        const outTokenDecimal = tokensData[idx]?.decimals || 18
        const slippage = 0.5 // TODO: Get from UI
        return Math.floor(toWei(value, outTokenDecimal).times((100 - slippage) / 100))
      })
      const result = await writeTxn(key, removeLiquidityuuid, routerContract, 'exitPoolAllTokens', [
        poolId32,
        amount,
        minAmountsOutToWei,
      ])

      if (!result) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Remove Liquidity Successfully',
      })

      setPending(false)

      if (typeof onSuccess === 'function') {
        onSuccess()
      }
      mutateAssets()
      return result
    },
    [account, chainId, endTxn, mutateAssets, routerContract, startTxn, t, writeTxn],
  )

  // Calc LP token amount when depositing
  const calcMinBPTAmountOutSingleToken = useCallback(
    async (poolId32, tokenDeposit, amountDeposit) => {
      setPending(true)
      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokenIndex = tokens.map(item => item.toLowerCase()).indexOf(tokenDeposit.address?.toLowerCase())

      if (!amountDeposit) return 0

      try {
        const minBPTAmountOut = await readCall(
          routerSimulatorContract,
          'joinPool',
          [poolId32, tokenIndex, Math.floor(toWei(amountDeposit, tokenDeposit.decimals))],
          chainId,
        )

        return roundIfMoreThanDecimals(minBPTAmountOut)
      } catch (error) {
        console.log(error)
        return null
      } finally {
        setPending(false)
      }
    },
    [chainId, routerSimulatorContract, vaultContract],
  )

  const calcMinBPTAmountOutAllToken = useCallback(
    async (poolId32, tokensDeposit) => {
      setPending(true)

      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())

      const sortedToken = tokensDeposit.sort((a, b) => {
        const indexA = tokensToLowerCase.indexOf(a.address)
        const indexB = tokensToLowerCase.indexOf(b.address)

        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })

      const amountIns = sortedToken.map(token => toWei(token.amountDeposit || 0, token.decimals))

      try {
        const minBPTAmountOut = await readCall(
          routerSimulatorContract,
          'joinPoolAllTokens',
          [poolId32, amountIns],
          chainId,
        )
        return roundIfMoreThanDecimals(minBPTAmountOut)
      } catch (error) {
        console.log(error)
        return ''
      } finally {
        setPending(false)
      }
    },
    [chainId, routerSimulatorContract, vaultContract],
  )

  // Calc token amount when withdrawing
  const calcMinAmountOutRemoveSingle = useCallback(
    async (pool, outToken, amount) => {
      setPending(true)
      try {
        const { address, poolId: poolId32 } = pool
        const weightedPoolContract = getWeightedPoolContract(address, chainId)

        const decimals = await readCall(weightedPoolContract, 'decimals', [], chainId)
        const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
        const tokensToLowerCase = tokens.map(item => item.toLowerCase())
        const outputTokenIndex = tokensToLowerCase?.indexOf(outToken?.address?.toLowerCase())

        const minAmountsOut = await readCall(
          routerSimulatorContract,
          'exitPool',
          [poolId32, toWei(amount, decimals), outputTokenIndex],
          chainId,
        )

        return new BigNumber(fromWei(minAmountsOut)).decimalPlaces(outToken.decimals, BigNumber.ROUND_DOWN).toString()
      } catch (error) {
        console.log(error)
        return ''
      } finally {
        setPending(false)
      }
    },
    [chainId, routerSimulatorContract, vaultContract],
  )

  const calcMinAmountOutRemoveAll = useCallback(
    async (pool, amount, tokensData) => {
      setPending(true)
      if (!amount) return []
      try {
        const weightedPoolContract = getWeightedPoolContract(pool.address, chainId)
        const lpTokenDecimals = await readCall(weightedPoolContract, 'decimals', [], chainId)

        const minAmountsOut = await readCall(
          routerSimulatorContract,
          'exitPoolAllTokens',
          [pool.poolId, toWei(amount, lpTokenDecimals)],
          chainId,
        )

        return minAmountsOut.map((value, idx) =>
          new BigNumber(fromWei(value)).decimalPlaces(tokensData[idx]?.decimals || 18, BigNumber.ROUND_DOWN).toString(),
        )
      } catch (error) {
        console.log(error)
        return []
      } finally {
        setPending(false)
      }
    },
    [chainId, routerSimulatorContract],
  )

  return {
    onCreateWeightedPool,
    onAddLiquiditySingleToken,
    onAddLiquidityAllToken,
    onRemoveLiquiditySingleToken,
    onRemoveLiquidityAllToken,
    calcMinBPTAmountOutSingleToken,
    calcMinBPTAmountOutAllToken,
    calcMinAmountOutRemoveSingle,
    calcMinAmountOutRemoveAll,
    pending,
  }
}
