import React, { Suspense } from 'react'

import Loading from '../loading'

export const metadata = {
  title: 'Protocols',
  description: 'Protocols Description',
}

export default function ProtocolsLayout({ children }) {
  return (
    <main className='desktop-bg flex min-h-screen flex-col'>
      <section className='layout'>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </section>
    </main>
  )
}
