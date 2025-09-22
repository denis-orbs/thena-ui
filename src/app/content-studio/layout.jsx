'use client'

import StudioShell from '@/modules/Studio/StudioLayout/StudioShell'
import Tabs from '@/modules/Studio/StudioLayout/Tabs'

export default function ContentStudioLayout({ children }) {
  return (
    <div className='fixed top-0 mt-[90px] w-full'>
      <div className='flex w-full flex-col gap-9'>
        <Tabs />
        <StudioShell>{children}</StudioShell>
      </div>
    </div>
  )
}
