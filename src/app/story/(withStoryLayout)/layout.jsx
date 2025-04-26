import React from 'react'

import Box from '@/components/box'
import Footer from '@/components/common/Footer'
import { TextHeading } from '@/components/typography'

export default function THEStoryLayout({ children }) {
  return (
    <main className='desktop-bg flex min-h-screen flex-col'>
      <section className='layout-container mt-[128px] !pb-0 lg:mt-[176px]'>
        <Box className='mb-[30px] gap-4 border border-primary-800 bg-primary-950'>
          <TextHeading className='block text-center text-neutral-100'>
            THE Story has ended and the Leaderboard price distribution is concluded. Please check the official
            communication channels for further updates.
          </TextHeading>
        </Box>
        {children}
      </section>
      <Footer />
    </main>
  )
}
