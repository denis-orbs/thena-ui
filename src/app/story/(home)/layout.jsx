import React from 'react'

import Footer from '@/components/common/Footer'

export default function THEStoryHomeLayout({ children }) {
  return (
    <main className='desktop-bg flex min-h-screen flex-col'>
      {children}
      <Footer />
    </main>
  )
}
