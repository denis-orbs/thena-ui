import React, { Suspense } from 'react'

import Loading from '../../loading'

export const metadata = {
  title: 'Dashboard',
  description: 'Dashboard Description',
}

export default function DashboardLayout({ children }) {
  return (
    <main className='desktop-bg flex min-h-screen flex-col'>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </main>
  )
}
