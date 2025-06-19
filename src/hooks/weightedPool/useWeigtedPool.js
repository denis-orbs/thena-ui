import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { v4 as uuidv4 } from 'uuid'
import { encodePacked, getAddress, maxUint256, parseEventLogs, toHex, zeroAddress } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'

import { PAIR_TYPES, TXN_STATUS } from '@/constant'
import { weightedPoolAbi, weightedPoolFactoryAbi, weightedPoolFeesAbi } from '@/constant/abi'
import Contracts, { CHAIN_ID } from '@/constant/contracts'
import { useAssets, useMutateAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import { usePairs } from '@/context/pairsContext'
import { batchCallMulti, callMulti, readCall, waitCall } from '@/lib/contractActions'
import {
  getEmergencyRouterContract,
  getERC20Contract,
  getGaugeContract,
  getWBNBContract,
  getWeightedGaugeContract,
  getWeightedPoolContract,
  getWeightedPoolFactoryContract,
  getWeightedPoolFeesContract,
  getWeightedPoolRouterContract,
  getWeightedPoolRouterSimulatorContract,
  getWeightedPoolVaultContract,
} from '@/lib/contracts'
import { getTokenInfo } from '@/lib/helper'
import { warnToast } from '@/lib/notify'
import { fromWei, isInvalidAmount, roundIfMoreThanDecimals, toWei, toWeiRound, wrappedAddress } from '@/lib/utils'
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

const getBalance = async (contract, account, chainId) => {
  try {
    if (!account) return new BigNumber(0)
    const balance = await readCall(contract, 'balanceOf', [account], chainId)

    return fromWei(balance)
  } catch (error) {
    console.error('Failed to fetch balance or decimals:', error)
    return new BigNumber(0)
  }
}

const getPoolOwner = async (contract, chainId) => {
  try {
    return readCall(contract, 'getOwner', [], chainId)
  } catch (error) {
    console.error('Failed to fetch pool owner:', error)
    return null
  }
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
    poolAddress && account && chainId && ['get balance pool', account, poolAddress, chainId],
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

export const useGaugeBalance = gaugeAddress => {
  const { account, chainId } = useWallet()
  const getGaugeBalance = useCallback(async () => {
    if (!gaugeAddress || gaugeAddress === zeroAddress) return 0
    try {
      const gaugeContract = getWeightedGaugeContract(gaugeAddress, chainId)
      const gaugeBalance = await getBalance(gaugeContract, account, chainId)
      return gaugeBalance
    } catch (error) {
      console.log(error)
      return 0
    }
  }, [account, chainId, gaugeAddress])

  const { data, isLoading, mutate } = useSWR(['getGaugeBalance', gaugeAddress, chainId, account], getGaugeBalance, {
    refreshInterval: 0,
  })

  return { gaugeBalance: data, isLoading, mutateGaugeBalance: mutate }
}

const handleStakeLP = async (
  pool,
  account,
  chainId,
  approveLpuuid,
  lpContract,
  writeTxn,
  setPending,
  stakeuuid,
  key,
) => {
  const weightedPoolContract = {
    address: pool.address,
    abi: weightedPoolAbi,
  }
  const balance = await getBalance(weightedPoolContract, account, chainId)
  let isApprovedLp = true
  const allowanceLp = await readCall(lpContract, 'allowance', [account, pool.gauge.address], chainId)
  isApprovedLp = fromWei(allowanceLp).gte(balance)

  if (!isApprovedLp) {
    if (!(await writeTxn(key, approveLpuuid, lpContract, 'approve', [pool.gauge.address, maxUint256]))) {
      setPending(false)
      return
    }
  }
  const gaugeContract = getGaugeContract(pool.gauge.address, chainId)
  const params = [toWei(balance, pool.decimals).toFixed(0)]
  if (!(await writeTxn(key, stakeuuid, gaugeContract, 'deposit', params))) {
    setPending(false)
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
    async (name, symbol, tokens, allocatesPercent, amountsWei, fee, onSuccess) => {
      try {
        const key = uuidv4()
        const createuuid = uuidv4()
        const initialLiquidityuuid = uuidv4()
        const registerPooluuid = uuidv4()
        const wrapuuid = uuidv4()

        const transactions = {}

        setPending(true)

        const wBNB = (tokens || []).find(token => token.symbol === 'BNB' || token.symbol === 'WBNB')
        let amountToWrap
        if (wBNB) {
          const index = (tokens || []).findIndex(token => token.symbol === 'BNB' || token.symbol === 'WBNB')
          const wBNBBalance = BigNumber.isBigNumber(wBNB?.balance) ? wBNB.balance : new BigNumber(wBNB.balance)
          if (wBNB && wBNBBalance.lt(fromWei(amountsWei?.[index]))) {
            amountToWrap = fromWei(amountsWei?.[index]).minus(wBNBBalance)
          }

          if (amountToWrap) {
            transactions[wrapuuid] = {
              desc: t('Wrap'),
              status: TXN_STATUS.START,
              hash: null,
            }
          }
        }

        for (const tokenItem of tokens) {
          const tokenContract = getERC20Contract(wrappedAddress(tokenItem), chainId)
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
              desc: `${t('Approve')} ${tokenItem.symbol === 'BNB' ? 'WBNB' : tokenItem.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            }
          }
        }

        transactions[createuuid] = {
          desc: t('Create Weighted Pool'),
          status: TXN_STATUS.START,
          hash: null,
        }

        transactions[registerPooluuid] = {
          desc: t('Register Pool'),
          status: TXN_STATUS.START,
          hash: null,
        }

        transactions[initialLiquidityuuid] = {
          desc: t('Add Initial Liquidity'),
          status: TXN_STATUS.START,
          hash: null,
        }

        startTxn({
          key,
          title: 'Create Weighted Pool',
          transactions,
        })

        if (amountToWrap && chainId !== CHAIN_ID.TEST_BSC) {
          const wbnbContract = getWBNBContract(chainId)
          if (!(await writeTxn(key, wrapuuid, wbnbContract, 'deposit', [], toWei(amountToWrap).dp(0).toString(10)))) {
            setPending(false)
            return
          }
        }

        for (const tokenItem of tokens) {
          if (tokenItem.id) {
            const tokenContract = getERC20Contract(wrappedAddress(tokenItem), chainId)
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

        const tokenIds = tokens.map(token => wrappedAddress(token))
        // Note: 40 => divide by 100 then toWei => 16 decimals
        const allocatesWei = allocatesPercent.map(allocates => toWei(allocates, 16).toFixed(0))

        const txHash = await writeTxn(key, createuuid, poolFactoryContract, 'create', [
          name,
          symbol,
          tokenIds,
          allocatesWei,
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
          amountsWei,
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
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
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
    async (pool, token, amountDeposit, minBPTAmountOut, slippage, amountToWrap, withStake, onSuccess) => {
      const poolId32 = pool.poolId
      setPending(true)
      const tokenContract = getERC20Contract(token.address, chainId)

      const handleInsufficientBalance = tokenSymbol => {
        warnToast('Insufficient [Asset] Balance', { symbol: tokenSymbol })
      }
      const wrapTokens = new Set(['BNB', 'WBNB'])

      if (fromWei(toWei(amountDeposit, token?.decimals), token?.decimals).gt(token?.balance)) {
        if (wrapTokens.has(token.symbol)) {
          if (!amountToWrap) {
            handleInsufficientBalance(token?.symbol)
            return false
          }
        } else {
          handleInsufficientBalance(token?.symbol)
          return false
        }
      }

      if (!pool.tvlUSD) {
        warnToast('Pool not initialized liquidity')
        return false
      }

      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const joinPooluuid = uuidv4()
      const wrapuuid = uuidv4()
      const stakeuuid = uuidv4()
      const approveLpuuid = uuidv4()

      const allowance = await readCall(
        tokenContract,
        'allowance',
        [account, Contracts.weightedPoolRouter[chainId]],
        chainId,
      )

      const isApprovedFee = fromWei(allowance, token.decimals).gte(amountDeposit)

      const lpContract = {
        address: pool.address,
        abi: weightedPoolAbi,
      }

      setPending(true)

      startTxn({
        key,
        title: 'Add Liquidity',
        transactions: {
          ...(amountToWrap && {
            [wrapuuid]: {
              desc: t('Wrap'),
              status: TXN_STATUS.WAITING,
              hash: null,
            },
          }),
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
          ...(withStake
            ? {
                [approveLpuuid]: {
                  desc: `${t('Approve')} LP`,
                  status: TXN_STATUS.START,
                  hash: null,
                },
                [stakeuuid]: {
                  desc: `${t('Stake')} ${pool.symbol} LP`,
                  status: TXN_STATUS.START,
                  hash: null,
                },
              }
            : {}),
        },
      })

      // TODO: cannot wrap in TEST_BSC
      if (amountToWrap && chainId !== CHAIN_ID.TEST_BSC) {
        const wbnbContract = getWBNBContract(chainId)
        if (!(await writeTxn(key, wrapuuid, wbnbContract, 'deposit', [], toWei(amountToWrap).dp(0).toString(10)))) {
          setPending(false)
          return
        }
      }

      if (!isApprovedFee) {
        const isSuccess = await writeTxn(key, approveFeeuuid, tokenContract, 'approve', [
          Contracts.weightedPoolRouter[chainId],
          toWei(amountDeposit, token?.decimals).toString(),
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())
      const idx = tokensToLowerCase?.indexOf(token?.address?.toLowerCase())
      const amountIn = toWeiRound(amountDeposit, token.decimals).toString()
      const minAmountOut = toWeiRound(
        BigNumber(minBPTAmountOut || 0).times((100 - slippage) / 100),
        token.decimals,
      ).toString()

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

      if (withStake) {
        await handleStakeLP(pool, account, chainId, approveLpuuid, lpContract, writeTxn, setPending, stakeuuid, key)
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
    async (pool, tokensData, minBPTAmountOut, slippage, amountToWrap, withStake, onSuccess) => {
      let isOutOfBalance = false
      const handleInsufficientBalance = tokenSymbol => {
        warnToast('Insufficient [Asset] Balance', { symbol: tokenSymbol })
        isOutOfBalance = true
      }

      if (!pool.tvlUSD) {
        const weightedPoolContract = getWeightedPoolContract(pool.address, chainId)
        const poolOwner = await getPoolOwner(weightedPoolContract, chainId)
        if (poolOwner?.toLowerCase() !== account.toLowerCase()) {
          warnToast('Pool not initialized liquidity')
          return false
        }
      }

      const wrapTokens = new Set(['BNB', 'WBNB'])
      for (const token of tokensData) {
        // Convert amount and check if it exceeds the balance
        const convertedAmount = fromWei(toWei(token.amount, token?.decimals), token?.decimals)

        if (convertedAmount.gt(token?.balance)) {
          // Check if the token is one that can be wrapped (e.g., BNB, WBNB)
          if (wrapTokens.has(token.symbol)) {
            if (!amountToWrap) {
              handleInsufficientBalance(token?.symbol) // BNB/WBNB specific warning
            }
          } else {
            handleInsufficientBalance(token?.symbol) // General token warning
          }
        }
      }

      if (isOutOfBalance) {
        return false
      }

      const poolId32 = pool.poolId
      const key = uuidv4()
      const addLiquidityuuid = uuidv4()
      const wrapuuid = uuidv4()
      const stakeuuid = uuidv4()
      const approveLpuuid = uuidv4()
      const initialLiquidityuuid = uuidv4()

      const lpContract = {
        address: pool.address,
        abi: weightedPoolAbi,
      }

      setPending(true)

      const transactions = {
        ...(amountToWrap && {
          [wrapuuid]: {
            desc: t('Wrap'),
            status: TXN_STATUS.WAITING,
            hash: null,
          },
        }),
      }
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

      if (!pool.tvlUSD) {
        transactions[initialLiquidityuuid] = {
          desc: t('Add Initial Liquidity'),
          status: TXN_STATUS.START,
          hash: null,
        }
      } else {
        transactions[addLiquidityuuid] = {
          desc: t('Add Liquidity'),
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      startTxn({
        key,
        title: 'Add Liquidity',
        transactions: {
          ...transactions,
          ...(withStake
            ? {
                [approveLpuuid]: {
                  desc: `${t('Approve')} LP`,
                  status: TXN_STATUS.START,
                  hash: null,
                },

                [stakeuuid]: {
                  desc: `${t('Stake')} ${pool.symbol} LP`,
                  status: TXN_STATUS.START,
                  hash: null,
                },
              }
            : {}),
        },
      })

      // TODO: cannot wrap in TEST_BSC
      if (amountToWrap && chainId !== CHAIN_ID.TEST_BSC) {
        const wbnbContract = getWBNBContract(chainId)
        if (!(await writeTxn(key, wrapuuid, wbnbContract, 'deposit', [], toWei(amountToWrap).dp(0).toString(10)))) {
          setPending(false)
          return
        }
      }

      for (const tokenItem of tokensData) {
        if (tokenItem.id) {
          const tokenContract = getERC20Contract(tokenItem.address, chainId)
          const isSuccess = await writeTxn(key, tokenItem.id, tokenContract, 'approve', [
            Contracts.weightedPoolRouter[chainId],
            toWei(tokenItem.amount, tokenItem.decimals).toString(),
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

      const assetsAddress = sortedAsset.map(asset => asset.address)
      const maxAmountsIn = sortedAsset.map(asset => toWei(asset.amount, asset.decimals).toString())

      let result = null
      if (!pool.tvlUSD) {
        result = await writeTxn(key, initialLiquidityuuid, routerContract, 'joinPoolInit', [
          poolId32,
          assetsAddress,
          maxAmountsIn,
        ])

        if (!result) {
          setPending(false)
          return false
        }
      } else {
        const minAmountOut = Math.floor(
          toWei(minBPTAmountOut || 0)
            .times((100 - slippage) / 100)
            .toNumber(),
        )

        result = await writeTxn(key, addLiquidityuuid, routerContract, 'joinPoolAllTokens', [
          poolId32,
          assetsAddress,
          maxAmountsIn,
          minAmountOut,
        ])

        if (!result) {
          setPending(false)
          return false
        }
      }

      if (withStake) {
        await handleStakeLP(pool, account, chainId, approveLpuuid, lpContract, writeTxn, setPending, stakeuuid, key)
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
    async (pool, outToken, amount, minAmountOut, slippage, onSuccess) => {
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
        title: 'Remove Liquidity',
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
    async (pool, amount, minAmountsOut, tokensData, slippage, onSuccess) => {
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
        title: 'Remove Liquidity',
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

      const amountIns = sortedToken.map(token => toWei(token.amount, token.decimals))

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

export const useWeightedPools = () => {
  const assets = useAssets()
  const customAssets = useCustomAssets()
  const { weightedPools: weightedPairs = [] } = usePairs()

  let weightedPools = []
  if (weightedPairs.length > 0 && assets.length > 0) {
    weightedPools = weightedPairs
      .map(weighted => {
        const { gauge } = weighted
        const tokens = weighted.tokens.map(token => {
          const tokenDetail = getTokenInfo({ tokenAddress: token.address, assets, customAssets })
          return {
            ...token,
            reserve: new BigNumber(token.reserve),
            ...tokenDetail,
            symbol: tokenDetail?.symbol === 'WBNB' ? 'BNB' : tokenDetail?.symbol || 'UNKNOWN',
          }
        })
        const totalTvl = new BigNumber(weighted.tvlUSD)
        let bribeUsd = 0
        const poolBribes = gauge.bribes
        let finalBribes = { fee: null, bribe: null }
        if (poolBribes) {
          if (poolBribes.bribe) {
            finalBribes.bribe = []
            poolBribes.bribe.forEach(ele => {
              const found = assets.find(asset => asset.address.toLowerCase() === ele.address.toLowerCase())
              bribeUsd += ele.amount * (found?.price || 0)
              finalBribes = {
                bribe: [
                  ...finalBribes.bribe,
                  {
                    address: ele.address,
                    decimals: found?.decimals || 18,
                    amount: ele.amount,
                    symbol: found?.symbol || 'UNKNOWN',
                  },
                ],
              }
            })
          }
          if (poolBribes.fee) {
            finalBribes.fee = []
            poolBribes.fee.forEach(ele => {
              const found = assets.find(asset => asset.address.toLowerCase() === ele.address.toLowerCase())
              bribeUsd += ele.amount * (found?.price || 0)
              finalBribes = {
                ...finalBribes,
                fee: [
                  ...finalBribes.fee,
                  {
                    address: ele.address,
                    decimals: found?.decimals || 18,
                    amount: ele.amount,
                    symbol: found?.symbol || 'UNKNOWN',
                  },
                ],
              }
            })
          }
        }
        const user = {
          walletBalance: 0,
          gaugeBalance: 0,
          gaugeEarned: 0,
          totalLp: 0,
          tokensClaimable: [],
          stakes: [],
          stakedUsd: 0,
          earnedUsd: 0,
          totals: [],
          totalUsd: 0,
        }
        return {
          ...weighted,
          stable: 'false',
          type: PAIR_TYPES.WEIGHTED,
          title: weighted.type,
          tvl: totalTvl,
          apr: weighted.gauge.apr,
          tokens,
          allowed: {},
          gauge: {
            ...gauge,
            bribeUsd: new BigNumber(bribeUsd),
            weight: new BigNumber(gauge.weight),
            weightPercent: new BigNumber(weighted.gauge.weightPercent || 0),
            bribes: finalBribes,
          },
          account: user,
          version: 3,
        }
      })
      .sort((a, b) => (a.gauge.tvl - b.gauge.tvl) * -1)
  }

  return weightedPools
}

const getGaugeReward = async (gaugeContract, assets, account, chainId) => {
  try {
    const rewardsAmount = await readCall(gaugeContract, 'earnedAll', [account], chainId)
    const rewardsLength = await readCall(gaugeContract, 'rewardTokensLength', [], chainId)
    const rewardsAddress = await callMulti(
      Array(Number(rewardsLength))
        .fill(0)
        .map((_, index) => ({
          ...gaugeContract,
          functionName: 'rewardTokens',
          args: [index],
          chainId,
        })),
    )

    const rewardsAsset = rewardsAddress
      .map(reward => assets.find(asset => asset.address === reward.toLowerCase()))
      .filter(Boolean)

    let total = new BigNumber(0)
    const finalReward = rewardsAsset.map((reward, index) => {
      const amount = fromWei(rewardsAmount[index], reward.decimals)
      total = total.plus(amount.times(reward.price))
      return {
        ...reward,
        fee: amount,
      }
    })

    return {
      total,
      tokenList: finalReward,
    }
  } catch (error) {
    console.error(error)
    return {
      total: new BigNumber(0),
      tokenList: [],
    }
  }
}

export const usePositionData = (pool, isStaked) => {
  const claimableStaked = useRef(0)
  const { chainId, account } = useWallet()
  const assets = useAssets()
  const poolContract = getWeightedPoolContract(pool?.address, chainId)
  const gaugeContract = getWeightedGaugeContract(pool?.gauge?.address, chainId)
  const contractGetBalance = isStaked ? gaugeContract : poolContract
  const vaultContract = getWeightedPoolVaultContract(chainId)
  const { data, refetch: mutateTokens } = useReadContracts({
    contracts: [
      {
        ...poolContract,
        functionName: 'feesContract',
      },
      {
        ...poolContract,
        functionName: 'totalSupply',
      },
      {
        ...contractGetBalance,
        functionName: 'balanceOf',
        args: [account],
      },
      {
        ...vaultContract,
        functionName: 'getPoolTokens',
        args: [pool?.poolId],
      },
    ],
    query: {
      enabled: Boolean(pool?.address) && pool.type === PAIR_TYPES.WEIGHTED,
    },
  })

  const [poolFeeContract, lpTokenTotalSupply, lpTokenBalance, tokenAddresses, tokenAmounts] = useMemo(() => {
    const poolFeeContractVal = data?.[0]?.result
    const lpTokenTotalSupplyVal = new BigNumber(data?.[1]?.result ?? 0)
    const lpTokenBalanceVal = new BigNumber(data?.[2]?.result ?? 0)
    const tokenAddressesVal = data?.[3]?.result?.[0] || []
    const tokenAmountsVal = data?.[3]?.result?.[1] || []

    return [poolFeeContractVal, lpTokenTotalSupplyVal, lpTokenBalanceVal, tokenAddressesVal, tokenAmountsVal]
  }, [data])

  const { data: expectedFees = [], refetch: mutateFees } = useReadContract({
    address: poolFeeContract,
    abi: weightedPoolFeesAbi,
    functionName: 'expectedFees',
    args: [account],
    query: {
      enabled: Boolean(poolFeeContract) && pool.type === PAIR_TYPES.WEIGHTED,
    },
  })

  const mappedToken = useMemo(() => {
    const map = {}
    tokenAddresses.forEach(address => {
      const token = (pool?.tokens || []).find(item => getAddress(item.address) === getAddress(address))
      map[address] = token
    })
    return map
  }, [pool?.tokens, tokenAddresses])

  const depositValue = useMemo(() => {
    const lpTokenPrice = new BigNumber(pool?.lpPrice || 0)

    const userAmountRatio = lpTokenBalance.div(lpTokenTotalSupply)
    return {
      tokens: tokenAddresses.map((address, index) => {
        const token = mappedToken[address]
        return {
          ...token,
          amount: userAmountRatio.times(fromWei(tokenAmounts[index], token.decimals)),
        }
      }, []),
      depositUsd: lpTokenPrice.times(fromWei(lpTokenBalance)),
    }
  }, [pool?.lpPrice, lpTokenBalance, lpTokenTotalSupply, tokenAddresses, mappedToken, tokenAmounts])

  const claimableFeeUnStake = useMemo(() => {
    let total = new BigNumber(0)
    const tokenList = tokenAddresses.map((address, index) => {
      const fee = new BigNumber(fromWei(expectedFees[index], mappedToken[address].decimals))
      total = total.plus(fee.times(mappedToken[address].price))

      return {
        address,
        fee,
        ...mappedToken[address],
      }
    })
    return {
      total,
      tokenList,
    }
  }, [expectedFees, mappedToken, tokenAddresses])

  const {
    data: claimableFeeStake,
    isLoading,
    mutate: mutateStake,
  } = useSWR(
    pool.gauge.address !== zeroAddress && ['getGaugeReward', gaugeContract, assets, account, chainId, isStaked],
    () => getGaugeReward(gaugeContract, assets, account, chainId),
    {
      refreshInterval: 60000,
    },
  )

  let result = claimableFeeStake

  if (isLoading) {
    result = claimableStaked.current
  } else {
    claimableStaked.current = claimableFeeStake
  }

  const mutatePosition = useCallback(() => {
    mutateTokens()
    mutateFees()
    mutateStake()
  }, [mutateFees, mutateTokens, mutateStake])

  return { claimableFee: isStaked ? result : claimableFeeUnStake, depositValue, mutatePosition }
}

export const getWeightedPoolData = async ({ pools = [], chainId, account, assets }) => {
  if (pools.length === 0) return []
  try {
    const poolContracts = pools.map(pool => getWeightedPoolContract(pool?.address, chainId))
    const gaugeContracts = pools.map(pool => getWeightedGaugeContract(pool?.gauge?.address, chainId))
    const vaultContract = getWeightedPoolVaultContract(chainId)
    const feesContracts = await batchCallMulti(
      poolContracts.map(contract => ({
        ...contract,
        functionName: 'feesContract',
      })),
    )

    const totalSupplies = await batchCallMulti(
      poolContracts.map(contract => ({
        ...contract,
        functionName: 'totalSupply',
      })),
    )

    const balancesOfPools = await batchCallMulti(
      pools.map((pool, index) => ({
        ...(pool.staked ? gaugeContracts[index] : poolContracts[index]),
        functionName: 'balanceOf',
        args: [account],
      })),
    )

    const getPoolTokens = await batchCallMulti(
      pools.map(pool => ({
        ...vaultContract,
        functionName: 'getPoolTokens',
        args: [pool?.poolId],
      })),
    )

    const weightedValues = pools.map((_, index) => {
      const poolFeeContract = feesContracts[index]
      const lpTokenTotalSupply = new BigNumber(totalSupplies[index] ?? 0)
      const lpTokenBalance = new BigNumber(balancesOfPools[index] ?? 0)
      const tokenAddresses = getPoolTokens[index]?.[0] || []
      const tokenAmounts = getPoolTokens[index]?.[1] || []
      return { poolFeeContract, lpTokenTotalSupply, lpTokenBalance, tokenAddresses, tokenAmounts }
    })

    const expectedFeesOfPools = await batchCallMulti(
      feesContracts.map(item => ({
        address: item,
        abi: weightedPoolFeesAbi,
        functionName: 'expectedFees',
        args: [account],
      })),
    )

    const weightedDatas = []
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i]
      const { poolFeeContract, lpTokenTotalSupply, lpTokenBalance, tokenAddresses, tokenAmounts } = weightedValues[i]
      let expectedFees = []
      if (Boolean(poolFeeContract) && pool.type === PAIR_TYPES.WEIGHTED) {
        expectedFees = expectedFeesOfPools[i]
      }

      const mappedToken = {}
      tokenAddresses.forEach(address => {
        const token = (pool?.tokens || []).find(item => getAddress(item.address) === getAddress(address))
        mappedToken[address] = token
      })

      const lpTokenPrice = new BigNumber(pool?.lpPrice || 0)

      const userAmountRatio = lpTokenBalance.div(lpTokenTotalSupply)
      const depositValue = {
        tokens: tokenAddresses.map((address, index) => {
          const token = mappedToken[address]
          return {
            ...token,
            amount: userAmountRatio.times(fromWei(tokenAmounts[index], token.decimals)),
          }
        }, []),
        depositUsd: lpTokenPrice.times(fromWei(lpTokenBalance)),
      }

      let total = new BigNumber(0)
      const tokenList = tokenAddresses.map((address, index) => {
        const fee = new BigNumber(fromWei(expectedFees[index], mappedToken[address].decimals))
        total = total.plus(fee.times(mappedToken[address].price))

        return {
          address,
          fee,
          ...mappedToken[address],
        }
      })

      const claimableFeeUnStake = {
        total,
        tokenList,
      }
      let claimableFeeStake
      if (pool.gauge.address !== zeroAddress) {
        claimableFeeStake = await getGaugeReward(gaugeContracts[i], assets, account, chainId)
      }
      weightedDatas.push({
        ...pool,
        apr: Number(pool?.apr?.replace('%', '')),
        claimableFee: pool.staked ? claimableFeeStake : claimableFeeUnStake,
        depositValue,
        fiatValueOfLiquidity: depositValue.depositUsd.toNumber(),
        rewardUsd: Number((pool.staked ? claimableFeeStake : claimableFeeUnStake)?.total),
      })
    }
    return weightedDatas
  } catch (error) {
    console.log(error)
    return []
  }
}

export const useWeightedPositionList = () => {
  const { account, chainId } = useWallet()
  const { weightedPools = [] } = usePairs()

  const getWeightedHasPositions = useCallback(async () => {
    const results = []
    for (let i = 0; i < weightedPools.length; i++) {
      const pool = weightedPools[i]
      const weightedPoolContract = getWeightedPoolContract(pool.address, chainId)
      let gaugeBalance
      if (pool.gauge.address !== zeroAddress) {
        const gaugeContract = getWeightedGaugeContract(pool.gauge.address, chainId)
        gaugeBalance = await getBalance(gaugeContract, account, chainId)
      }
      const poolBalance = await getBalance(weightedPoolContract, account, chainId)
      results.push({
        pool,
        hasPositionNotStaked: !isInvalidAmount(poolBalance),
        hasPositionStaked: !isInvalidAmount(gaugeBalance),
      })
    }
    return results
      .filter(result => result.hasPositionNotStaked || result.hasPositionStaked)
      .map(result => ({
        ...result.pool,
        notStaked: result.hasPositionNotStaked,
        staked: result.hasPositionStaked,
      }))
  }, [account, chainId, weightedPools])

  const { data } = useSWR(
    ['getWeightedHasPositions', weightedPools.length, account, chainId],
    () => getWeightedHasPositions(),
    {
      refreshInterval: 60000,
    },
  )
  return data || []
}

export const useClaimWeightedPoolFees = () => {
  const { chainId } = useWallet()
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const [pending, setPending] = useState(false)

  const onClaimFees = useCallback(
    async (pool, onSuccess) => {
      try {
        const key = uuidv4()
        const claimuuid = uuidv4()

        const poolContract = getWeightedPoolContract(pool?.address, chainId)
        const feesContractAddress = await readCall(poolContract, 'feesContract', [], chainId)
        const feesContract = getWeightedPoolFeesContract(feesContractAddress, chainId)
        setPending(true)
        startTxn({
          key,
          title: 'Claim Fees',
          transactions: {
            [claimuuid]: { desc: t('Claim Fees'), status: TXN_STATUS.START, hash: null },
          },
        })

        const result = await writeTxn(key, claimuuid, feesContract, 'claimFees', [])

        if (result) {
          endTxn({
            key,
            final: 'Claim Successful',
          })
        }

        if (typeof onSuccess === 'function') {
          onSuccess()
        }
      } catch (error) {
        console.error(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, endTxn, startTxn, t, writeTxn],
  )

  return { onClaimFees, pending }
}

export const useGaugeStakeWeighted = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onGaugeStake = useCallback(
    async (pool, amount, callback) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const stakeuuid = uuidv4()
      try {
        const lpContract = getERC20Contract(pool.address, chainId)

        setPending(true)

        const allowance = await readCall(lpContract, 'allowance', [account, pool.gauge.address], chainId)
        const isApproved = fromWei(allowance).gte(amount)

        startTxn({
          key,
          title: 'Stake',
          desc: `${t('Stake')} LP`,
          transactions: {
            ...(!isApproved && {
              [approveuuid]: {
                desc: `${t('Approve')} LP`,
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [stakeuuid]: {
              desc: `${t('Stake')} ${pool.symbol} LP`,
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })
        if (!isApproved) {
          if (!(await writeTxn(key, approveuuid, lpContract, 'approve', [pool.gauge.address, maxUint256]))) {
            setPending(false)
            return
          }
        }
        const gaugeContract = getGaugeContract(pool.gauge.address, chainId)
        const params = [toWei(amount, pool.decimals).toFixed(0)]
        if (!(await writeTxn(key, stakeuuid, gaugeContract, 'deposit', params))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Stake Successful',
        })
        setPending(false)
        callback()
      } catch (error) {
        console.log(error)
        return
      } finally {
        setPending(false)
      }
    },
    [account, chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onGaugeStake, pending }
}

export const useGaugeUnstakeWeighted = balance => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onGaugeUnstake = useCallback(
    async (pool, amount, callback) => {
      const key = uuidv4()
      const unstakeuuid = uuidv4()
      const approveuuid = uuidv4()
      try {
        const gaugeContract = getWeightedGaugeContract(pool.gauge.address, chainId)
        const rewardsAmount = await readCall(gaugeContract, 'earnedAll', [account], chainId)
        const shouldHarvest =
          (rewardsAmount || []).some(item => !isInvalidAmount(item)) && new BigNumber(amount).gte(balance)

        const lpContract = getERC20Contract(pool.address, chainId)
        const allowance = await readCall(lpContract, 'allowance', [account, pool.gauge.address], chainId)
        const isApproved = fromWei(allowance).gte(amount)

        setPending(true)

        startTxn({
          key,
          title: shouldHarvest ? t('Unstake and Harvest') : `${t('Unstake')} LP`,
          transactions: {
            ...(!isApproved && {
              [approveuuid]: {
                desc: `${t('Approve')} LP`,
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [unstakeuuid]: {
              desc: shouldHarvest ? t('Unstake and Harvest') : `${t('Unstake')} LP`,
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        if (!isApproved) {
          if (!(await writeTxn(key, approveuuid, lpContract, 'approve', [pool.gauge.address, maxUint256]))) {
            setPending(false)
            return
          }
        }
        const params = shouldHarvest ? [] : [toWei(amount, pool.decimals).toFixed(0)]
        const func = shouldHarvest ? 'withdrawAllAndHarvest' : 'withdraw'

        if (!(await writeTxn(key, unstakeuuid, gaugeContract, func, params))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Unstake Successful',
        })
        setPending(false)
        callback()
      } catch (error) {
        console.log(error)
        return
      } finally {
        setPending(false)
      }
    },
    [chainId, account, balance, startTxn, t, writeTxn, endTxn],
  )

  return { onGaugeUnstake, pending }
}

export const useGaugeHarvestWeighted = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onGaugeHarvest = useCallback(
    async pair => {
      const key = uuidv4()
      const harvestuuid = uuidv4()

      setPending(true)

      startTxn({
        key,
        title: 'Harvest Rewards',
        transactions: {
          [harvestuuid]: {
            desc: t('Harvest Rewards'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      const gaugeContract = getWeightedGaugeContract(pair.gauge.address, chainId)
      if (!(await writeTxn(key, harvestuuid, gaugeContract, 'getReward', []))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Harvest Successful',
      })
      setPending(false)
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onGaugeHarvest, pending }
}

export const useWithdrawUserBalanceWeighted = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onWithdrawUserBalance = useCallback(async () => {
    const key = uuidv4()
    const withdrawuuid = uuidv4()

    setPending(true)

    startTxn({
      key,
      title: 'Withdraw User Balance',
      transactions: {
        [withdrawuuid]: {
          desc: t('Withdraw User Balance'),
          status: TXN_STATUS.START,
          hash: null,
        },
      },
    })
    const emergencyRouterContract = getEmergencyRouterContract(chainId)
    if (!(await writeTxn(key, withdrawuuid, emergencyRouterContract, 'withdrawUserBalance', []))) {
      setPending(false)
      return
    }

    endTxn({
      key,
      final: 'Withdraw Successful',
    })
    setPending(false)
  }, [chainId, startTxn, writeTxn, endTxn, t])

  return { onWithdrawUserBalance, pending }
}
