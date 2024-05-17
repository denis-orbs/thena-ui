import React from 'react'

export const metadata = {
  title: {
    default: 'Browse',
    template: '%s | THENA Arena',
  },
  description: 'Browse Description',
}

export default function BrowseLayout({ children }) {
  return <section>{children}</section>
}
