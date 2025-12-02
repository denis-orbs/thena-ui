import dynamic from 'next/dynamic'
import React from 'react'

const Footer = dynamic(() => import('@/components/common/Footer'), { ssr: false })
const Home = dynamic(() => import('@/modules/Home'), { ssr: true })

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
      <Footer isHomePage />
    </>
  )
}
