import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import MenuTab from '../MenuTab'

function MenuTabMint() {
  const t = useTranslations()
  const pathname = usePathname()

  const menuData = useMemo(
    () => [
      {
        title: t('Mint Thena Id'),
        isActive: pathname.includes('/mint') || pathname.includes('/gift'),
        isLink: true,
        url: '/arena/thena-id/mint',
      },
      {
        title: t('Available THENA IDs'),
        isActive: pathname.includes('/available'),
        isLink: true,
        url: '/arena/thena-id/available',
      },
      {
        title: t('Recent THENA ID Mints'),
        isActive: pathname.includes('/recently-minted') || pathname.includes('/recently-gifted'),
        isLink: true,
        url: '/arena/thena-id/recently-minted',
      },
    ],
    [pathname, t],
  )

  return <MenuTab menuData={menuData} className='mt-6' />
}

export default MenuTabMint
