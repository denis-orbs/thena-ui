import React, { Suspense } from 'react'

import Loading from '../loading'

export const metadata = {
  title: 'Swap',
  description: 'Swap Description',
}

export default function SwapLayout({ children }) {
  return (
    <main className='relative flex min-h-screen flex-col'>
      <section>
        <div className='swap-bg fixed left-0 right-0 mx-auto' />
        <div className='layout'>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </div>
      </section>
    </main>
  )
}
