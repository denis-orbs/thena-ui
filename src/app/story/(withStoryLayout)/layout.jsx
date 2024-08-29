import React from 'react'

import Footer from '@/components/common/Footer'

export default function THEStoryLayout({ children }) {
  return (
    <main className='desktop-bg flex min-h-screen flex-col'>
      <section className='layout-container mt-[128px] !pb-0 lg:mt-[176px]'>{children}</section>
      <Footer />
    </main>
  )
}
