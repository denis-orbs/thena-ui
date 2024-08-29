import React, { Suspense } from 'react'

import Footer from '@/components/common/Footer'

import Loading from '../../loading'

export const metadata = {
  title: 'THE Story',
  description: 'THE Story Description',
}

export default function THEStoryLayout({ children }) {
  return (
    <main className='desktop-bg flex min-h-screen flex-col'>
      <section className='layout-container mt-[128px] !pb-0 lg:mt-[176px]'>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </section>
      <Footer />
    </main>
  )
}
