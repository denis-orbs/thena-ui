import React from 'react'

import { WrapLayout } from './WrapLayout'

export default function layout({ children, params }) {
  return <WrapLayout params={params}>{children}</WrapLayout>
}
