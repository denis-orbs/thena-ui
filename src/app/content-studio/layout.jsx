'use client'

import StudioShell from '@/modules/Studio/StudioLayout/StudioShell'
import Tabs from '@/modules/Studio/StudioLayout/Tabs'

export default function ContentStudioLayout({ children }) {
  return (
    <div>
      <div className='fixed top-[70px] z-40 w-full md:top-[90px]'>
        <Tabs />
      </div>
      <div className='mt-[158px] flex w-full overflow-x-auto md:mt-[206px]'>
        <StudioShell>{children}</StudioShell>
      </div>
    </div>
  )
}
