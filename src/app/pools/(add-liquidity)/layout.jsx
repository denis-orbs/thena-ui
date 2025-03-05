import React, { Suspense } from 'react'

import Loading from '@/app/loading'

export const metadata = {
  title: 'Pools',
  description: 'Pools Description',
}

export default function PoolsLayout({ children }) {
  return (
    <main className='flex min-h-screen flex-col bg-neutral-950'>
      <section className='layout'>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </section>
    </main>
  )
}
