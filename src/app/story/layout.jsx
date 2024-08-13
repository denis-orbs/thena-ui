import React, { Suspense } from 'react'

import Loading from '../loading'

export default function layout({ children }) {
  return (
    <section className='layout-container mt-[128px] pt-0 lg:mt-[176px]'>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </section>
  )
}
