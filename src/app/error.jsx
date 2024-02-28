'use client'

import React, { useEffect } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'

export default function Error({ error, reset }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  return (
    <section>
      <div className='flex min-h-screen flex-col items-center justify-center gap-4 text-center text-neutral-50'>
        <h1 className='text-4xl md:text-6xl'>Oops, something went wrong!</h1>
        <PrimaryButton onClick={reset}>Try again</PrimaryButton>
      </div>
    </section>
  )
}
