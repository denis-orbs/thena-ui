import React, { Suspense } from 'react'

import Loading from '../loading'

export const metadata = {
  title: 'Analytics',
  description: 'Analytics Description',
}

export default function AnalyticsLayout({ children }) {
  return (
    <main className='desktop-bg flex min-h-screen flex-col'>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </main>
  )
}
