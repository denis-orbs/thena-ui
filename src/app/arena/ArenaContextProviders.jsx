'use client'

import { PairContractContextProvider } from '@/app/arena/PairsContractContext'
import { UserInfoContextProvider } from '@/app/arena/UserInfoContext'

import { TCContextProvider } from './TCContext'

export function ArenaContextProviders({ children }) {
  return (
    <PairContractContextProvider>
      <UserInfoContextProvider>
        <TCContextProvider>{children}</TCContextProvider>
      </UserInfoContextProvider>
    </PairContractContextProvider>
  )
}
