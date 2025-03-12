import React, { Suspense } from 'react'

import Loading from '@/app/loading'

export const metadata = {
  title: 'Pools',
  description: 'Pools Description',
}

export default function PoolsLayout({ children }) {
  return (
    <main className='flex min-h-screen flex-col bg-neutral-950'>
      <section className='layout pb-8 max-md:pt-8 md:pb-20'>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </section>
    </main>
  )
}
