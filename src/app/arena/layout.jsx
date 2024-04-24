import React, { Suspense } from 'react'

import { ArenaContextProviders } from './ArenaContextProviders'
import Loading from '../loading'

export const metadata = {
  title: 'Arena',
  description: 'Arena Description',
}

export default function ArenaLayout({ children }) {
  return (
    <ArenaContextProviders>
      <section className='layout-container mt-[128px] pt-0 lg:mt-[176px]'>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </section>
    </ArenaContextProviders>
  )
}
