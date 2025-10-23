'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'

import Selection from '@/components/selection'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const items = [
  { slug: 'pool-apr', label: 'Pools APR' },
  { slug: 'incentives', label: 'Incentives' },
  { slug: 'portfolio', label: 'Portfolio' },
  { slug: 'metrics', label: 'Metrics' },
]

export default function Tabs() {
  const pathname = usePathname()
  const router = useRouter()
  const { isLgDown } = useMediaQuery()

  const templateSelections = useMemo(
    () =>
      items.map(item => ({
        label: item.label,
        active: pathname.includes(`/content-studio/${item.slug}`),
        onClickHandler: () => {
          router.push(`/content-studio/${item.slug}`)
        },
      })),
    [pathname, router],
  )
  return (
    <div className='w-full'>
      <Selection
        className='h-8 w-full flex-1 items-stretch lg:h-11'
        classNames={{
          items: 'md:text-sm text-xs',
        }}
        data={templateSelections}
        isFull
        isTranslation={false}
        isSmall={isLgDown}
      />
    </div>
  )
}
