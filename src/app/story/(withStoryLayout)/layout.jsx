import React, { Suspense } from 'react'

import Footer from '@/components/common/Footer'
import { siteConfig } from '@/constant/config'

import Loading from '../../loading'

export const metadata = {
  title: 'THE Story of THENA - Join the Epic 8-Week Voyage Through DeFi',
  description:
    'Get ready to embark on an epic 8-week journey with THENA! Complete tasks, collect NFT fragments, rise on the leaderboard, and unlock over $30,000 in rewards. Start your adventure today.',
  keywords:
    'THENA, THE Story, DeFi, BNB Chain, NFT, campaign, rewards, leaderboard, crypto, blockchain, 8-week voyage, trading, DEX, staking, SocialFi',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  openGraph: {
    title: 'THE Story of THENA - Join the Epic 8-Week Voyage Through DeFi',
    description:
      'Get ready to embark on an epic 8-week journey with THENA! Complete tasks, collect NFT fragments, rise on the leaderboard, and unlock over $30,000 in rewards. Start your adventure today.',
    images: [`${siteConfig.url}/images/meta-story-image.png`],
    url: `${siteConfig.url}/story`,
    alternates: {
      canonical: `${siteConfig.url}/story`,
    },
  },
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
