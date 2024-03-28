import React, { Suspense } from 'react'

import Loading from '@/app/loading'

function CompetitionDetailLayout({ children }) {
  return (
    <main className='flex min-h-screen flex-col'>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </main>
  )
}

export default CompetitionDetailLayout
