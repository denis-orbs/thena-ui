'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { slug: 'pools-apr', label: 'Pools APR' },
  { slug: 'incentives', label: 'Incentives' },
  { slug: 'portfolio', label: 'Portfolio' },
  { slug: 'metrics', label: 'Metrics' },
]

export default function Tabs() {
  const pathname = usePathname()
  return (
    <div className='w-full bg-neutral-900 py-4.5'>
      <div className='mx-auto flex max-w-[1420px] gap-2 px-4'>
        {items.map(it => {
          const active = pathname.includes(`/content-studio/${it.slug}`)
          return (
            <Link
              key={it.slug}
              href={`/content-studio/${it.slug}`}
              className={`rounded-md px-3 py-2 text-sm ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              {it.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
