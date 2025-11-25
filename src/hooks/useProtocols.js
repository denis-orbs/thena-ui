import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import ERC20Abi from '@/abis/erc20.json'
import { BribeABI } from '@/abis/ve/BribeABI'
import { GlobalFactoryABI } from '@/abis/ve/GlobalFactoryABI'
import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { warnToast } from '@/lib/notify'
import { useTxn } from '@/state/transactions/hooks'
import { toWei } from '@/utils/utils'

const POOL_TYPES = {
  Classic: 0,
  Stable: 0,
  'Conc Liquidity': 1,
}

export const useGaugeAdd = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onGaugeAdd = useCallback(
    async (pool, callback) => {
      if (!pool) {
        warnToast('Select Pair')
        return
      }
      const globalFactoryContract = {
        address: Contracts.GlobalFactory[chainId],
        abi: GlobalFactoryABI,
      }

      const res = await Promise.all([
        readCall(globalFactoryContract, 'isToken', [pool.token0.address], chainId),
        readCall(globalFactoryContract, 'isToken', [pool.token1.address], chainId),
      ])

      const isWhitelisted = res.every(ele => ele)
      if (!isWhitelisted) {
        warnToast('Tokens are not whitelisted')
        return
      }
      const key = uuidv4()
      const adduuid = uuidv4()
      startTxn({
        key,
        title: 'Add Gauge',
        transactions: {
          [adduuid]: {
            desc: t('Add Gauge'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)
      const params = [pool.address, POOL_TYPES[pool.type]]
      if (!(await writeTxn(key, adduuid, globalFactoryContract, 'create', params))) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Gauge Add Successful' })
      callback()
      setPending(false)
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onGaugeAdd, pending }
}

export const useBribeAdd = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onBribeAdd = useCallback(
    async (pool, asset, amounts, callback) => {
      const total = Object.values(amounts).reduce((sum, curr) => sum + Number(curr), 0)

      const key = uuidv4()
      const approveuuid = uuidv4()
      const bribeuuid = uuidv4()
      const bribeAddress = pool.gauge.bribe
      const tokenContract = {
        address: asset.address,
        abi: ERC20Abi,
      }
      const allowance = await readCall(tokenContract, 'allowance', [account, bribeAddress], chainId)
      const amountToApprove = toWei(total, asset.decimals).minus(allowance)

      setPending(true)
      startTxn({
        key,
        title: 'Add Incentive',
        transactions: {
          ...(amountToApprove.gt(0) && {
            [approveuuid]: {
              desc: `${t('Approve')} ${asset.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [bribeuuid]: {
            desc: t('Add Incentive'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (amountToApprove.gt(0)) {
        if (!(await writeTxn(key, approveuuid, tokenContract, 'approve', [bribeAddress, amountToApprove]))) {
          setPending(false)
          return
        }
      }

      const bribeContract = {
        address: bribeAddress,
        abi: BribeABI,
      }
      const txHash = await writeTxn(key, bribeuuid, bribeContract, 'notifyRewardAmountForMultipleEpoch', [
        asset.address,
        Object.values(amounts).map(val => toWei(val, asset.decimals).toFixed(0)),
      ])
      if (!txHash) {
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
    [account, chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onBribeAdd, pending }
}
