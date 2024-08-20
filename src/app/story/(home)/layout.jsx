import React, { Suspense } from 'react'

import Footer from '@/components/common/Footer'

import Loading from '../../loading'

export const metadata = {
  title: 'THE Story',
  description: 'THE Story Description',
}

export default function THEStoryHomeLayout({ children }) {
  return (
    <main className='desktop-bg flex min-h-screen flex-col'>
      <Suspense fallback={<Loading />}>{children}</Suspense>
      <Footer />
    </main>
  )
}
