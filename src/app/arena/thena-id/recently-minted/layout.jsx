import React from 'react'

export const metadata = {
  title: 'Recently minted THENA IDs',
  description: 'Recently minted THENA IDs Description',
}

export default function RecentlyMintedLayout({ children }) {
  return <section className='layout-container pt-0'>{children}</section>
}
