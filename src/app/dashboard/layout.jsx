import React, { Suspense } from 'react'

import { VeRewardsContextProvider } from './VeRewardsContext'
import Loading from '../loading'

export const metadata = {
  title: 'Dashboard',
  description: 'Dashboard Description',
}

export default function DashboardLayout({ children }) {
  return (
    <main className='flex min-h-screen flex-col bg-neutral-950'>
      <VeRewardsContextProvider>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </VeRewardsContextProvider>
    </main>
  )
}
