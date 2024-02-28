import React, { Suspense } from 'react'

import Loading from '../loading'

export const metadata = {
  title: 'Arena',
  description: 'Arena Description',
}

export default function ArenaLayout({ children }) {
  return (
    <main className='desktop-bg flex min-h-screen flex-col'>
      <section className='layout'>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </section>
    </main>
  )
}
