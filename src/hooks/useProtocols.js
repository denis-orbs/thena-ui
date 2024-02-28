import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { PAIR_TYPES, TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import { getBribeContract, getERC20Contract, getVoterContract } from '@/lib/contracts'
import { warnToast } from '@/lib/notify'
import { fromWei, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useGaugeAdd = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onGaugeAdd = useCallback(
    async (pool, callback) => {
      if (!pool) {
        warnToast('Select pair')
        return
      }
      const voterContract = getVoterContract(chainId)
      const res = await Promise.all([
        readCall(voterContract, 'isWhitelisted', [pool.token0.address], chainId),
        readCall(voterContract, 'isWhitelisted', [pool.token1.address], chainId),
      ])
      if (!res[0] || !res[1]) {
        warnToast('Tokens are not whitelisted')
        return
      }
      const key = uuidv4()
      const adduuid = uuidv4()
      startTxn({
        key,
        title: 'Add gauge',
        transactions: {
          [adduuid]: {
            desc: `Add gauge for ${pool.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)

      const params = [pool.address, pool.type === PAIR_TYPES.LSD ? 1 : 0]
      if (!(await writeTxn(key, adduuid, voterContract, 'createGauge', params))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Gauge Add Successful',
      })
      callback()
      setPending(false)
    },
    [chainId, startTxn, writeTxn, endTxn],
  )

  return { onGaugeAdd, pending }
}

export const useBribeAdd = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onBribeAdd = useCallback(
    async (pool, asset, amount, callback) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const bribeuuid = uuidv4()
      const bribeAddress = pool.gauge.bribe
      const tokenContract = getERC20Contract(asset.address, chainId)
      const allowance = await readCall(tokenContract, 'allowance', [account, bribeAddress])
      const isApproved = fromWei(allowance).gte(amount)
      setPending(true)
      startTxn({
        key,
        title: 'Add bribe',
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: `Approve ${asset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [bribeuuid]: {
            desc: 'Add bribe',
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      if (!isApproved) {
        if (!(await writeTxn(key, approveuuid, tokenContract, 'approve', [bribeAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      const bribeContract = getBribeContract(bribeAddress, chainId)
      const sendAmount = toWei(amount, asset.decimals).toFixed(0)
      const params = [asset.address, sendAmount]
      if (!(await writeTxn(key, bribeuuid, bribeContract, 'notifyRewardAmount', params))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Bribe Add Successful',
      })
      callback()
      setPending(false)
    },
    [account, chainId, startTxn, writeTxn, endTxn],
  )

  return { onBribeAdd, pending }
}
