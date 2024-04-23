import { Suspense } from 'react'

import Loading from '@/app/loading'

export const metadata = {
  title: 'Rankings',
  description: 'Rankings',
}

export default function RankingsLayout({ children }) {
  return (
    <main className='flex min-h-screen flex-col'>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </main>
  )
}
