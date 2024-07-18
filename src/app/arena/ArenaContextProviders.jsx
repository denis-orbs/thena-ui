'use client'

import { PairContractContextProvider } from '@/context/pairsContractContext'
import { UserInfoContextProvider } from '@/context/userInfoContext'

export function ArenaContextProviders({ children }) {
  return (
    <PairContractContextProvider>
      <UserInfoContextProvider>{children}</UserInfoContextProvider>
    </PairContractContextProvider>
  )
}
