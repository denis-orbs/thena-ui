import { Suspense } from 'react'

import Loading from '../loading'

export const metadata = {
  title: 'Trade To Earn',
  description: 'Trade To Earn Description',
}

export default function TradeToEarnLayout({ children }) {
  return (
    <main className='relative flex min-h-screen flex-col'>
      <section>
        <div className='fixed left-0 right-0 mx-auto' />
        <div className='layout'>
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </div>
      </section>
    </main>
  )
}
