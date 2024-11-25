import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { encodePacked, maxUint256, parseEventLogs, toHex } from 'viem'

import { TXN_STATUS } from '@/constant'
import { thenaWeightedPoolFactoryAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import { readCall, waitCall } from '@/lib/contractActions'
import {
  getERC20Contract,
  getThenaRouterContract,
  getThenaWeightedPoolFactoryContract,
  getWeightedPoolContract,
} from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import { useTxn } from '@/state/transactions/hooks'

import useWallet from '../useWallet'

export const useWeightedPool = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const handleGetPoolId = useCallback(async txHash => {
    const txnReceipt = await waitCall(txHash)
    const eventLogs = parseEventLogs({
      abi: thenaWeightedPoolFactoryAbi,
      eventName: 'PoolCreated',
      logs: txnReceipt.logs,
    })
    console.log({ eventLogs })
    if (eventLogs && eventLogs.length > 0) {
      const parsed = eventLogs[0]
      if (parsed.args) {
        return parsed.args.pool
      }
    }

    return ''
  }, [])

  function toBytes32(hexString) {
    const rawBytes = Uint8Array.from(Buffer.from(hexString.slice(2), 'hex'))

    if (rawBytes.length > 32) {
      return rawBytes.slice(0, 32)
    }
    const finalBytes = new Uint8Array(32)
    finalBytes.set(rawBytes)
    return finalBytes
  }

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
      if (onSuccess) {
        onSuccess(poolId)
      }
    },
    [account, chainId, endTxn, handleGetPoolId, startTxn, t, writeTxn],
  )

  return { onCreateWeightedPool, pending }
}
