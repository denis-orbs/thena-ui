import React, { Suspense } from 'react'

import Loading from '../loading'

export const metadata = {
  title: 'Pools',
  description: 'Pools Description',
}

export default function PoolsLayout({ children }) {
  return (
    <main className='flex min-h-screen flex-col bg-[url(/pool-background.png)] bg-cover bg-fixed bg-center'>
      <section className='layout'>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </section>
    </main>
  )
}
