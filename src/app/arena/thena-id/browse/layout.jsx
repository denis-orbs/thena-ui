import React from 'react'

export const metadata = {
  title: 'Browse',
  description: 'Browse Description',
}

export default function BrowseLayout({ children }) {
  return <section className='layout-container pt-0'>{children}</section>
}
