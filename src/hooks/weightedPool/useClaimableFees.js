import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import { getFeesContractWeightedPool, getWeightedPoolContract } from '@/lib/contracts'
import { useTxn } from '@/state/transactions/hooks'

import useWallet from '../useWallet'

const useClaimableFees = () => {
  const { chainId } = useWallet()
  const t = useTranslations()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const [pending, setPending] = useState(false)

  const onClaimableFees = async pool => {
    try {
      const key = uuidv4()
      const claimableuuid = uuidv4()

      const poolContract = getWeightedPoolContract(pool?.address, chainId)
      const feesContractAddress = await readCall(poolContract, 'feesContract', [], chainId)
      const feesContract = getFeesContractWeightedPool(feesContractAddress, chainId)
      setPending(true)
      startTxn({
        key,
        title: t('Claimable Fees'),
        transactions: {
          [claimableuuid]: { desc: t('Claimable Fees'), status: TXN_STATUS.START, hash: null },
        },
      })

      const result = await writeTxn(key, claimableuuid, feesContract, 'claimFees', [])

      if (result) {
        endTxn({
          key,
          final: 'Claim Fees Successful',
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setPending(false)
    }
  }

  return { onClaimableFees, pending }
}

export default useClaimableFees
