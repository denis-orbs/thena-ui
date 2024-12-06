import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import useSWR from 'swr'
import { v4 as uuidv4 } from 'uuid'
import { encodePacked, maxUint256, parseEventLogs, toHex } from 'viem'

import { TXN_STATUS } from '@/constant'
import { thenaWeightedPoolFactoryAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import { useMutateAssets } from '@/context/assetsContext'
import { readCall, waitCall } from '@/lib/contractActions'
import {
  getERC20Contract,
  getThenaRouterContract,
  getThenaRouterSimulatorContract,
  getThenaWeightedPoolFactoryContract,
  getVaultContract,
  getWeightedPoolContract,
} from '@/lib/contracts'
import { fromWei, roundIfMoreThan18Decimals, toWei } from '@/lib/utils'
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

  const getBalanceAndDecimals = useCallback(async () => {
    try {
      const weightedPoolContract = getWeightedPoolContract(poolAddress, chainId)

      const balance = await readCall(weightedPoolContract, 'balanceOf', [account], chainId)
      const decimals = await readCall(weightedPoolContract, 'decimals', [], chainId)

      return { balance: fromWei(balance), decimals }
    } catch (error) {
      console.error('Failed to fetch balance or decimals:', error)
    }
  }, [account, chainId, poolAddress])

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
    decimals: data?.decimals ?? new BigNumber(18),
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

  const handleGetPoolId = useCallback(async txHash => {
    const txnReceipt = await waitCall(txHash)
    const eventLogs = parseEventLogs({
      abi: thenaWeightedPoolFactoryAbi,
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
      const weightedPoolFactoryContract = getThenaWeightedPoolFactoryContract(chainId)
      const thenaRouterContract = getThenaRouterContract(chainId)
      const registerPooluuid = uuidv4()

      const transactions = {}

      setPending(true)

      for (let i = 0; i < Object.keys(tokens).length; i++) {
        const address = Object.keys(tokens)[i]
        const tokenContract = getERC20Contract(tokens[address].address, chainId)
        const approveFeeuuid = uuidv4()
        const allowance = await readCall(tokenContract, 'allowance', [account, Contracts.ThenaRouter[chainId]], chainId)

        const isApprovedFee = fromWei(allowance, tokens[address].decimals).gte(
          tokens[address].amount,
          tokens[address].decimals,
        )

        if (!isApprovedFee) {
          tokens[address].id = approveFeeuuid
          transactions[approveFeeuuid] = {
            desc: `${t('Approve')} ${tokens[address].symbol}`,
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

      for (let i = 0; i < Object.keys(tokens).length; i++) {
        const address = Object.keys(tokens)[i]
        if (tokens[address].id) {
          const tokenContract = getERC20Contract(tokens[address].address, chainId)
          // console.log({ key, tokens: tokens[address].id, tokenContract })
          const isSuccess = await writeTxn(key, tokens[address].id, tokenContract, 'approve', [
            Contracts.ThenaRouter[chainId],
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

      const txHash = await writeTxn(key, createuuid, weightedPoolFactoryContract, 'create', [
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
      await writeTxn(key, registerPooluuid, thenaRouterContract, 'registerPool', [poolId32, fee * 100])
      const result = await writeTxn(key, initialLiquidityuuid, thenaRouterContract, 'joinPoolInit', [
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
    [account, chainId, endTxn, handleGetPoolId, startTxn, mutateAssets, t, writeTxn],
  )

  const onAddLiquiditySingleToken = useCallback(
    async (poolId32, token, amountDeposit, minBPTAmountOut, onSuccess) => {
      setPending(true)
      const tokenContract = getERC20Contract(token.address, chainId)
      const thenaRouterContract = getThenaRouterContract(chainId)

      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const joinPooluuid = uuidv4()

      const allowance = await readCall(tokenContract, 'allowance', [account, Contracts.ThenaRouter[chainId]], chainId)

      const isApprovedFee = fromWei(allowance, token.decimals).gte(toWei(amountDeposit), token.decimals)

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
          Contracts.ThenaRouter[chainId],
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const vaultContract = getVaultContract(chainId)
      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())
      const idx = tokensToLowerCase?.indexOf(token?.address?.toLowerCase())

      const result = await writeTxn(key, joinPooluuid, thenaRouterContract, 'joinPool', [
        poolId32,
        idx,
        toWei(amountDeposit),
        toWei(minBPTAmountOut),
      ])

      if (!result) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Add Liquidity Weighted Pool Successful',
      })

      setPending(false)

      if (typeof onSuccess === 'function') {
        onSuccess()
      }
      mutateAssets()
      return result
    },
    [account, chainId, endTxn, mutateAssets, startTxn, t, writeTxn],
  )

  const onAddLiquidityAllToken = useCallback(
    async (poolId32, assets, minBPTAmountOut, onSuccess) => {
      const key = uuidv4()
      const addLiquidityuuid = uuidv4()
      const thenaRouterContract = getThenaRouterContract(chainId)

      const transactions = {}
      setPending(true)

      for (let i = 0; i < Object.keys(assets).length; i++) {
        const address = Object.keys(assets)[i]
        const tokenContract = getERC20Contract(assets[address].address, chainId)
        const approveFeeuuid = uuidv4()
        const allowance = await readCall(tokenContract, 'allowance', [account, Contracts.ThenaRouter[chainId]], chainId)

        const isApprovedFee = fromWei(allowance, assets[address].decimals).gte(
          assets[address].amountDeposit,
          assets[address].decimals,
        )

        if (!isApprovedFee) {
          assets[address].id = approveFeeuuid
          transactions[approveFeeuuid] = {
            desc: `${t('Approve')} ${assets[address].symbol}`,
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

      for (let i = 0; i < Object.keys(assets).length; i++) {
        const address = Object.keys(assets)[i]
        if (assets[address].id) {
          const tokenContract = getERC20Contract(assets[address].address, chainId)
          const isSuccess = await writeTxn(key, assets[address].id, tokenContract, 'approve', [
            Contracts.ThenaRouter[chainId],
            maxUint256,
          ])

          if (!isSuccess) {
            setPending(false)
            return false
          }
        }
      }

      const vaultContract = getVaultContract(chainId)
      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())

      const sortedAsset = assets.sort((a, b) => {
        const indexA = tokensToLowerCase.indexOf(a.address)
        const indexB = tokensToLowerCase.indexOf(b.address)

        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })

      const assetsAddress = assets.map(asset => asset.address)
      const maxAmountsIn = sortedAsset.map(asset => asset.amountDeposit)

      const result = await writeTxn(key, addLiquidityuuid, thenaRouterContract, 'joinPoolAllTokens', [
        poolId32,
        assetsAddress,
        maxAmountsIn,
        toWei(minBPTAmountOut),
      ])

      if (!result) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Add Liquidity Weighted Pool Successful',
      })

      setPending(false)

      if (typeof onSuccess === 'function') {
        onSuccess()
      }
      mutateAssets()
      return result
    },
    [account, chainId, endTxn, mutateAssets, startTxn, t, writeTxn],
  )

  const onRemoveLiquiditySingleToken = useCallback(
    async (pool, tokenSelect, amount, onSuccess) => {
      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const removeLiquidityuuid = uuidv4()

      const { poolId: poolId32, address: poolAddress } = pool

      const thenaRouterContract = getThenaRouterContract(chainId)
      const weightedPoolContract = getWeightedPoolContract(poolAddress, chainId)

      const decimals = await readCall(weightedPoolContract, 'decimals', [], chainId)
      const vaultContract = getVaultContract(chainId)
      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())
      const outputTokenIndex = tokensToLowerCase?.indexOf(tokenSelect?.address?.toLowerCase())

      const lpTokenContract = getERC20Contract(poolAddress, chainId)

      const allowance = await readCall(lpTokenContract, 'allowance', [account, Contracts.ThenaRouter[chainId]], chainId)

      const isApprovedFee = fromWei(allowance, decimals).gte(amount, decimals)

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
          Contracts.ThenaRouter[chainId],
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const result = await writeTxn(key, removeLiquidityuuid, thenaRouterContract, 'exitPool', [
        poolId32,
        amount,
        outputTokenIndex,
        1,
      ])

      if (!result) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Remove Liquidity Weighted Pool Successful',
      })

      setPending(false)

      if (typeof onSuccess === 'function') {
        onSuccess()
      }
      mutateAssets()
      return result
    },
    [account, chainId, endTxn, mutateAssets, startTxn, t, writeTxn],
  )

  const onRemoveLiquidityAllToken = useCallback(
    async (pool, amount, onSuccess) => {
      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const removeLiquidityuuid = uuidv4()

      const { poolId: poolId32, address: poolAddress } = pool

      const thenaRouterContract = getThenaRouterContract(chainId)
      const weightedPoolContract = getWeightedPoolContract(poolAddress, chainId)
      const decimals = await readCall(weightedPoolContract, 'decimals', [], chainId)
      const vaultContract = getVaultContract(chainId)
      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())
      const sortedAsset = (pool.tokens || []).sort((a, b) => {
        const indexA = tokensToLowerCase.indexOf(a.address)
        const indexB = tokensToLowerCase.indexOf(b.address)

        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })

      const lpTokenContract = getERC20Contract(poolAddress, chainId)

      const allowance = await readCall(lpTokenContract, 'allowance', [account, Contracts.ThenaRouter[chainId]], chainId)

      const isApprovedFee = fromWei(allowance, decimals).gte(amount, decimals)

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
          Contracts.ThenaRouter[chainId],
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const minAmountsOut = sortedAsset.map(() => 1)

      const result = await writeTxn(key, removeLiquidityuuid, thenaRouterContract, 'exitPoolAllTokens', [
        poolId32,
        amount,
        minAmountsOut,
      ])

      if (!result) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Remove Liquidity Weighted Pool Successful',
      })

      setPending(false)

      if (typeof onSuccess === 'function') {
        onSuccess()
      }
      mutateAssets()
      return result
    },
    [account, chainId, endTxn, mutateAssets, startTxn, t, writeTxn],
  )

  const calcMinBPTAmountOutSingleToken = useCallback(
    async (poolId32, tokenDeposit, amountDeposit) => {
      setPending(true)
      const thenaRouterSimulatorContract = getThenaRouterSimulatorContract(chainId)
      const vaultContract = getVaultContract(chainId)
      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())
      const tokenIndex = tokensToLowerCase?.indexOf(tokenDeposit?.address?.toLowerCase())

      try {
        const minBPTAmountOut = await readCall(
          thenaRouterSimulatorContract,
          'joinPool',
          [poolId32, tokenIndex, toWei(amountDeposit, tokenDeposit.decimals)],
          chainId,
        )
        return roundIfMoreThan18Decimals(minBPTAmountOut)
      } catch (error) {
        console.log(error)
        return 0
      } finally {
        setPending(false)
      }
    },
    [chainId],
  )

  const calcMinBPTAmountOutAllToken = useCallback(
    async (poolId32, tokensDeposit) => {
      setPending(true)
      const thenaRouterSimulatorContract = getThenaRouterSimulatorContract(chainId)

      const vaultContract = getVaultContract(chainId)
      const [tokens] = await readCall(vaultContract, 'getPoolTokens', [poolId32], chainId)
      const tokensToLowerCase = tokens.map(item => item.toLowerCase())

      const sortedToken = tokensDeposit.sort((a, b) => {
        const indexA = tokensToLowerCase.indexOf(a.address)
        const indexB = tokensToLowerCase.indexOf(b.address)

        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })

      const amountIns = sortedToken.map(token => toWei(token.amountDeposit))

      try {
        const minBPTAmountOut = await readCall(
          thenaRouterSimulatorContract,
          'joinPoolAllTokens',
          [poolId32, amountIns],
          chainId,
        )
        return roundIfMoreThan18Decimals(minBPTAmountOut)
      } catch (error) {
        console.log(error)
        return 0
      } finally {
        setPending(false)
      }
    },
    [chainId],
  )

  return {
    onCreateWeightedPool,
    onAddLiquiditySingleToken,
    onAddLiquidityAllToken,
    onRemoveLiquiditySingleToken,
    onRemoveLiquidityAllToken,
    calcMinBPTAmountOutSingleToken,
    calcMinBPTAmountOutAllToken,
    pending,
  }
}
