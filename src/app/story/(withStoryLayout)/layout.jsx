import React, { Suspense } from 'react'

import Footer from '@/components/common/Footer'

import Loading from '../../loading'

export const metadata = {
  title: 'THE Story',
  description: 'Earn Rewards Description',
}

export default function EarnRewardLayout({ children }) {
  return (
    <main className='desktop-bg flex min-h-screen flex-col'>
      <section className='layout-container mt-[128px] lg:mt-[176px]'>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </section>
      <Footer />
    </main>
  )
}
