import React from 'react'

export const metadata = {
  title: 'Not Found',
}

export default function NotFound() {
  return (
    <main>
      <section>
        <div className='layout flex flex-col items-center justify-center text-center'>
          <h1 className='text-4xl md:text-6xl'>Page Not Found</h1>
          <a href='/'>Back to home</a>
        </div>
      </section>
    </main>
  )
}
