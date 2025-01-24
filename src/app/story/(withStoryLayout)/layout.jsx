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
            THE Story has ended. We are now preparing the final rewards and the price distribution will be announced at
            a later stage.
          </TextHeading>
        </Box>
        {children}
      </section>
      <Footer />
    </main>
  )
}
