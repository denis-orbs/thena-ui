'use client'

import { useEffect, useState } from 'react'

import { NotShowBannerV3 } from '@/constant'
import { cn } from '@/lib/utils'
import StudioShell from '@/modules/Studio/StudioLayout/StudioShell'
import Tabs from '@/modules/Studio/StudioLayout/Tabs'

export default function ContentStudioLayout({ children }) {
  const [showBannerMigrate, setShowBannerMigrate] = useState(false)

  useEffect(() => {
    const updateBanner = () => {
      const shouldShow = !localStorage.getItem(NotShowBannerV3) && new Date() >= new Date('2025-05-22')
      setShowBannerMigrate(shouldShow)
    }

    updateBanner()

    window.addEventListener('local-storage-changed', updateBanner)
    return () => window.removeEventListener('local-storage-changed', updateBanner)
  }, [])

  return (
    <div>
      <div
        className={cn('fixed top-[70px] z-40 w-full md:top-[90px]', showBannerMigrate && 'top-[186px] md:top-[144px]')}
      >
        <Tabs />
      </div>
      <div
        className={cn(
          'mt-[158px] flex w-full overflow-x-auto md:mt-[206px]',
          showBannerMigrate && 'mt-[274px] md:mt-[260px]',
        )}
      >
        <StudioShell>{children}</StudioShell>
      </div>
    </div>
  )
}
