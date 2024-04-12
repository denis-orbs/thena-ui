import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { TXN_STATUS } from '@/constant'
import { getDibsRewarderContract } from '@/lib/contracts'
import useWallet from '@/lib/wallets/useWallet'
import { fetchMuon } from '@/modules/TradeToEarn'
import { useTxn } from '@/state/transactions/hooks'

export const useClaimReward = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()
  const t = useTranslations()

  const onClaimReward = useCallback(
    async (account, day) => {
      const key = uuidv4()
      const claimuuid = uuidv4()

      setPending(true)

      const muonResponse = await fetchMuon(account, day)

      if (muonResponse && muonResponse.success) {
        const sigTimestamp = muonResponse?.result?.data?.timestamp
        const reqId = muonResponse?.result?.reqId
        const userVolume = muonResponse?.result?.data?.result?.userVolume
        const totalVolume = muonResponse?.result?.data?.result?.totalVolume
        const schnorrsign = {
          signature: muonResponse?.result?.signatures[0].signature,
          owner: muonResponse?.result?.signatures[0].owner,
          nonce: muonResponse?.result?.data.init.nonceAddress,
        }
        const gatewaySignature = muonResponse?.result?.nodeSignature

        const dibsRewarderContract = getDibsRewarderContract(chainId)

        startTxn({
          key,
          title: t('Claim Earnings'),
          transactions: {
            [claimuuid]: {
              desc: t('Claim Earnings'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        const isSuccess = await writeTxn(key, claimuuid, dibsRewarderContract, 'claim', [
          parseInt(day, 10),
          userVolume,
          totalVolume,
          sigTimestamp,
          reqId,
          schnorrsign,
          gatewaySignature,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }

        endTxn({
          key,
          final: 'Claimed',
        })

        setPending(false)
        return isSuccess
      }

      return false
    },
    [chainId, endTxn, startTxn, t, writeTxn],
  )

  return { onClaimReward, pending }
}
