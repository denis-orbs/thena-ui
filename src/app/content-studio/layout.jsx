'use client'

import { cn } from '@/lib/utils'
import StudioShell from '@/modules/Studio/StudioLayout/StudioShell'
import Tabs from '@/modules/Studio/StudioLayout/Tabs'
import { useMigratePositionWarning } from '@/state/positions/hooks'

export default function ContentStudioLayout({ children }) {
  const { showBannerMigrate } = useMigratePositionWarning()

  return (
    <div>
      <div
        className={cn('fixed top-[70px] z-40 w-full md:top-[90px]', showBannerMigrate && 'top-[186px] md:top-[144px]')}
      >
        <Tabs />
      </div>
      <div className={cn('mt-[158px] md:mt-[206px] lg:mx-8', showBannerMigrate && 'mt-[274px] md:mt-[260px]')}>
        <StudioShell>{children}</StudioShell>
      </div>
    </div>
  )
}
