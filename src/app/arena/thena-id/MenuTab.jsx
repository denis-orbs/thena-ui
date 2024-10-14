import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { cn } from '@/lib/utils'

function MenuTab() {
  const t = useTranslations()
  const pathname = usePathname()

  return (
    <div className='mt-6 flex w-fit items-center gap-[2px] rounded-[8px] bg-neutral-800 p-1 lg:gap-1'>
      <EmphasisButton
        className={cn(
          'px-3 py-2',
          pathname.includes('/mint') || pathname.includes('/gift') ? 'bg-neutral-600' : 'bg-transparent',
        )}
      >
        <Link href='/arena/thena-id/mint' className='text-xs lg:text-sm' prefetch={false}>
          {t('Mint Thena Id')}
        </Link>
      </EmphasisButton>
      <EmphasisButton
        className={cn('px-3 py-2', pathname.includes('/available') ? 'bg-neutral-600' : 'bg-transparent')}
      >
        <Link href='/arena/thena-id/available' className='text-xs lg:text-sm' prefetch={false}>
          {t('Available THENA IDs')}
        </Link>
      </EmphasisButton>
      <EmphasisButton
        className={cn(
          'px-3 py-2',
          pathname.includes('/recently-minted') || pathname.includes('/recently-gifted')
            ? 'bg-neutral-600'
            : 'bg-transparent',
        )}
      >
        <Link href='/arena/thena-id/recently-minted' className='text-xs lg:text-sm' prefetch={false}>
          {t('Recent THENA ID Mints')}
        </Link>
      </EmphasisButton>
    </div>
  )
}

export default MenuTab
