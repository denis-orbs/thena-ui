import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { TXN_STATUS } from '@/constant'
import { getVeTheAutomationContract } from '@/lib/contracts'
import { convertBooleansToHex } from '@/lib/utils'
import { useTxn } from '@/state/transactions/hooks'

import useWallet from '../useWallet'

export const useCreateAutomation = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const t = useTranslations()

  const { startTxn, endTxn, writeTxn } = useTxn()

  const onCreateAutomation = useCallback(
    async contract => {
      const key = uuidv4()
      const createAutouuid = uuidv4()
      const veTheAutomation = getVeTheAutomationContract(chainId)
      const { settings, votes } = contract

      const { pairs } = votes

      const tokenId = contract.veTHEId
      const startTimestamp = settings.executionTime
      const operations = convertBooleansToHex(votes.isAutoVote, settings.isClaimEveryWeek, settings.isRelockEveryWeek)
      const pools = pairs.map(pair => pair.pair.address)
      const weights = pairs.map(pair => pair.weight)

      console.log({ operations })
      startTxn({
        key,
        title: 'Create Automation Contract',
        transactions: {
          [createAutouuid]: {
            desc: t('Create'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      try {
        setPending(true)
        if (
          !(await writeTxn(key, createAutouuid, veTheAutomation, 'createAutomation', [
            tokenId,
            Math.floor(startTimestamp / 1000),
            operations,
            pools,
            weights,
          ]))
        ) {
          setPending(false)
          return false
        }

        endTxn({
          key,
          final: 'Create Automation Contract Successful',
        })

        return true
      } catch (error) {
        console.error(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, endTxn, startTxn, t, writeTxn],
  )

  return { onCreateAutomation, pending }
}
