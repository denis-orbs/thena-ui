'use client'

import { UserInfoContextProvider } from '@/context/userInfoContext'

export function ArenaContextProviders({ children }) {
  return <UserInfoContextProvider>{children}</UserInfoContextProvider>
}
