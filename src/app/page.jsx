import React from 'react'

import Footer from '@/components/common/Footer'
import Home from '@/modules/Home'

export default function HomePage() {
  return (
    <>
      <main className='flex min-h-screen flex-col'>
        <section>
          <div className='layout-top'>
            <Home />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
