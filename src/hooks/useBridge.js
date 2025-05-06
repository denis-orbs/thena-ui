import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { useWallet } from '@/hooks/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useBridge = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onBridge = useCallback(async (targetAddress, amount) => {
    const key = uuidv4()
    const approveUuid = uuidv4()
    const bridgeUuid = uuidv4()
    console.log({ targetAddress, amount, key, approveUuid, bridgeUuid, account, startTxn, endTxn, writeTxn, t })
    setPending(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { onBridge, pending }
}
