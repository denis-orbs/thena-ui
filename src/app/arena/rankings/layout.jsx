import { Suspense } from 'react'

import Loading from '@/app/loading'
import { siteConfig } from '@/constant/config'

export const metadata = {
  title: 'ARENA Rankings',
  description:
    'See the full rankings on THENA Arena. Sort by total THE balance, volume traded, followers, following, trading competitions joined and created and a lot more.',
  openGraph: {
    url: `${siteConfig.url}/arena/rankings`,
    title: 'ARENA Rankings',
    description:
      'See the full rankings on THENA Arena. Sort by total THE balance, volume traded, followers, following, trading competitions joined and created and a lot more.',
    siteName: 'ARENA Rankings | THENA Arena',
    images: [`${siteConfig.url}/cover.png`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARENA Rankings',
    description:
      'See the full rankings on THENA Arena. Sort by total THE balance, volume traded, followers, following, trading competitions joined and created and a lot more.',
    images: [`${siteConfig.url}/cover.png`],
  },
}

export default function RankingsLayout({ children }) {
  return (
    <main className='flex min-h-screen flex-col'>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </main>
  )
}
