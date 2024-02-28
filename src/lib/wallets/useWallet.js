import { useMemo } from 'react'
import { useAccount } from 'wagmi'

import { useChainSettings } from '@/state/settings/hooks'

export default function useWallet() {
  const { address, isConnected, connector, chainId } = useAccount()
  const { networkId } = useChainSettings()

  return useMemo(
    () => ({
      account: chainId === networkId ? address : null,
      active: isConnected,
      connector,
      chainId,
    }),
    [address, isConnected, chainId, connector, networkId],
  )
}
